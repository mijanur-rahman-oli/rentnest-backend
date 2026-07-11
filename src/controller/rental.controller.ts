import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

export const createRentalRequest = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { propertyId, moveInDate, durationMonths, message } = req.body as {
    propertyId: string;
    moveInDate: string;
    durationMonths?: number;
    message?: string;
  };

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw ApiError.notFound("Property not found");
  if (property.status !== "AVAILABLE") {
    throw ApiError.badRequest("This property is not currently available for rent");
  }
  if (property.landlordId === tenantId) {
    throw ApiError.badRequest("You cannot request your own property");
  }

  const existingPending = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,
      tenantId,
      status: { in: ["PENDING", "APPROVED", "PAYMENT_DUE"] },
    },
  });
  if (existingPending) {
    throw ApiError.conflict("You already have an active request for this property");
  }

  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      tenantId,
      propertyId,
      moveInDate: new Date(moveInDate),
      durationMonths: durationMonths ?? 12,
      message,
    },
  });

  return sendSuccess(res, 201, "Rental request submitted successfully", rentalRequest);
});

export const getMyRentalRequests = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const requests = await prisma.rentalRequest.findMany({
    where: { tenantId },
    include: { property: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, 200, "Rental requests fetched successfully", requests);
});

export const getRentalRequestById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { id } = req.params;

  const request = await prisma.rentalRequest.findUnique({
    where: { id },
    include: { property: true, payments: true },
  });

  if (!request) throw ApiError.notFound("Rental request not found");
  if (request.tenantId !== tenantId) {
    throw ApiError.forbidden("You do not have access to this rental request");
  }

  return sendSuccess(res, 200, "Rental request fetched successfully", request);
});
