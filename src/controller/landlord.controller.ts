import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

/**
 * POST /api/landlord/properties
 */
export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const data = req.body;

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw ApiError.badRequest("Invalid categoryId");
  }

  const property = await prisma.property.create({
    data: { ...data, landlordId },
  });

  return sendSuccess(res, 201, "Property listing created successfully", property);
});

/**
 * GET /api/landlord/properties - landlord's own listings
 */
export const getMyProperties = asyncHandler(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const properties = await prisma.property.findMany({
    where: { landlordId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, 200, "Your properties fetched successfully", properties);
});

async function assertOwnership(propertyId: string, landlordId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw ApiError.notFound("Property not found");
  if (property.landlordId !== landlordId) {
    throw ApiError.forbidden("You do not own this property");
  }
  return property;
}

/**
 * PUT /api/landlord/properties/:id
 */
export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const { id } = req.params;

  await assertOwnership(id, landlordId);

  const updated = await prisma.property.update({
    where: { id },
    data: req.body,
  });

  return sendSuccess(res, 200, "Property updated successfully", updated);
});

/**
 * DELETE /api/landlord/properties/:id
 */
export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const { id } = req.params;

  await assertOwnership(id, landlordId);

  await prisma.property.delete({ where: { id } });

  return sendSuccess(res, 200, "Property removed successfully", null);
});

/**
 * GET /api/landlord/requests - all rental requests for landlord's properties
 */
export const getLandlordRequests = asyncHandler(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;

  const requests = await prisma.rentalRequest.findMany({
    where: { property: { landlordId } },
    include: {
      property: true,
      tenant: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return sendSuccess(res, 200, "Rental requests fetched successfully", requests);
});

/**
 * PATCH /api/landlord/requests/:id - approve or reject
 */
export const updateRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const { id } = req.params;
  const { status, rejectReason } = req.body as {
    status: "APPROVED" | "REJECTED";
    rejectReason?: string;
  };

  const request = await prisma.rentalRequest.findUnique({
    where: { id },
    include: { property: true },
  });

  if (!request) throw ApiError.notFound("Rental request not found");
  if (request.property.landlordId !== landlordId) {
    throw ApiError.forbidden("You do not manage this property");
  }
  if (request.status !== "PENDING") {
    throw ApiError.badRequest(`Request has already been ${request.status.toLowerCase()}`);
  }

  const updated = await prisma.rentalRequest.update({
    where: { id },
    data: {
      status: status === "APPROVED" ? "PAYMENT_DUE" : "REJECTED",
      rejectReason: status === "REJECTED" ? rejectReason ?? null : null,
    },
  });

  return sendSuccess(
    res,
    200,
    `Rental request ${status === "APPROVED" ? "approved" : "rejected"} successfully`,
    updated
  );
});
