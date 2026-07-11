import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { rentalRequestId, rating, comment } = req.body as {
    rentalRequestId: string;
    rating: number;
    comment?: string;
  };

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { review: true },
  });

  if (!rentalRequest) throw ApiError.notFound("Rental request not found");
  if (rentalRequest.tenantId !== tenantId) {
    throw ApiError.forbidden("You can only review your own rentals");
  }
  if (!["ACTIVE", "COMPLETED"].includes(rentalRequest.status)) {
    throw ApiError.badRequest("You can only review a rental after payment has been completed");
  }
  if (rentalRequest.review) {
    throw ApiError.conflict("You have already reviewed this rental");
  }

  const review = await prisma.review.create({
    data: {
      tenantId,
      propertyId: rentalRequest.propertyId,
      rentalRequestId,
      rating,
      comment,
    },
  });

  return sendSuccess(res, 201, "Review submitted successfully", review);
});
