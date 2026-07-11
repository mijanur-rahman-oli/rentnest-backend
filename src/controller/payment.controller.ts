import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db";
import { stripe } from "../config/stripe";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { rentalRequestId } = req.body as { rentalRequestId: string };

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { property: true },
  });

  if (!rentalRequest) throw ApiError.notFound("Rental request not found");
  if (rentalRequest.tenantId !== tenantId) {
    throw ApiError.forbidden("You do not have access to this rental request");
  }
  if (rentalRequest.status !== "PAYMENT_DUE") {
    throw ApiError.badRequest(
      "This rental request is not awaiting payment. It must be approved by the landlord first."
    );
  }

  const existingPending = await prisma.payment.findFirst({
    where: { rentalRequestId, status: "PENDING" },
  });
  if (existingPending) {
    // Reuse the existing pending session instead of creating a duplicate.
    return sendSuccess(res, 200, "Existing pending payment session found", existingPending);
  }

  const amount = rentalRequest.property.price;
  const transactionId = `RN-${crypto.randomUUID()}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Rent - ${rentalRequest.property.title}`,
            description: `${rentalRequest.durationMonths} month(s) rental at ${rentalRequest.property.address}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      rentalRequestId,
      tenantId,
      transactionId,
    },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });

  const payment = await prisma.payment.create({
    data: {
      transactionId,
      amount,
      currency: "USD",
      method: "card",
      provider: "STRIPE",
      status: "PENDING",
      providerSessionId: session.id,
      rentalRequestId,
      tenantId,
    },
  });

  return sendSuccess(res, 201, "Payment session created successfully", {
    payment,
    checkoutUrl: session.url,
    sessionId: session.id,
  });
});

/**
 * POST /api/payments/confirm
 * Confirms a payment by re-checking the Stripe session status. In production
 * this would typically be driven by a Stripe webhook, but a manual confirm
 * endpoint is provided for callback/testing flows via Postman.
 */
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: string };

  const payment = await prisma.payment.findFirst({ where: { providerSessionId: sessionId } });
  if (!payment) throw ApiError.notFound("Payment not found for this session");

  if (payment.status === "COMPLETED") {
    return sendSuccess(res, 200, "Payment already confirmed", payment);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    const failed = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    throw ApiError.badRequest("Payment has not been completed on Stripe", failed);
  }

  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", paidAt: new Date() },
    }),
    prisma.rentalRequest.update({
      where: { id: payment.rentalRequestId },
      data: { status: "ACTIVE" },
    }),
  ]);

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: payment.rentalRequestId },
  });
  if (rentalRequest) {
    await prisma.property.update({
      where: { id: rentalRequest.propertyId },
      data: { status: "RENTED" },
    });
  }

  return sendSuccess(res, 200, "Payment confirmed successfully", updatedPayment);
});

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint (alternative/production path to /confirm).
 * Requires raw body parsing — wired up separately in app.ts.
 */
export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return res.status(400).json({ success: false, message, errorDetails: null });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string };
    const payment = await prisma.payment.findFirst({
      where: { providerSessionId: session.id },
    });

    if (payment && payment.status !== "COMPLETED") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED", paidAt: new Date() },
        }),
        prisma.rentalRequest.update({
          where: { id: payment.rentalRequestId },
          data: { status: "ACTIVE" },
        }),
      ]);

      const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id: payment.rentalRequestId },
      });
      if (rentalRequest) {
        await prisma.property.update({
          where: { id: rentalRequest.propertyId },
          data: { status: "RENTED" },
        });
      }
    }
  }

  res.json({ received: true });
});

/**
 * GET /api/payments - authenticated user's payment history
 */
export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const payments = await prisma.payment.findMany({
    where: { tenantId },
    include: { rentalRequest: { include: { property: true } } },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, 200, "Payment history fetched successfully", payments);
});

/**
 * GET /api/payments/:id
 */
export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { rentalRequest: { include: { property: true } } },
  });

  if (!payment) throw ApiError.notFound("Payment not found");
  if (payment.tenantId !== tenantId) {
    throw ApiError.forbidden("You do not have access to this payment");
  }

  return sendSuccess(res, 200, "Payment fetched successfully", payment);
});
