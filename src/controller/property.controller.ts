import { Request, Response } from "express";
import { Prisma, PropertyType } from "@prisma/client";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const { city, type, minPrice, maxPrice, amenities, categoryId } = req.query as Record<
    string,
    string | undefined
  >;

  const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "10", 10), 1), 50);

  const where: Prisma.PropertyWhereInput = {
    status: "AVAILABLE",
  };

  if (city) where.city = { contains: city, mode: "insensitive" };
  if (type) where.type = type as PropertyType;
  if (categoryId) where.categoryId = categoryId;
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }
  if (amenities) {
    const list = amenities.split(",").map((a) => a.trim()).filter(Boolean);
    if (list.length) where.amenities = { hasEvery: list };
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        category: true,
        landlord: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  return sendSuccess(res, 200, "Properties fetched successfully", {
    properties,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/properties/:id
 */
export const getPropertyById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: true,
      landlord: { select: { id: true, name: true, phone: true, email: true } },
      reviews: {
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!property) {
    throw ApiError.notFound("Property not found");
  }

  return sendSuccess(res, 200, "Property fetched successfully", property);
});
