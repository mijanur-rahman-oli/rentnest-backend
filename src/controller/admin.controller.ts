import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

/**
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, 200, "Users fetched successfully", users);
});

/**
 * PATCH /api/admin/users/:id - ban/unban
 */
export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: "ACTIVE" | "BANNED" };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound("User not found");
  if (user.role === "ADMIN") {
    throw ApiError.forbidden("Admin accounts cannot be banned");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return sendSuccess(res, 200, `User ${status === "BANNED" ? "banned" : "unbanned"} successfully`, updated);
});

/**
 * GET /api/admin/properties - all listings platform-wide
 */
export const getAllProperties = asyncHandler(async (req: Request, res: Response) => {
  const properties = await prisma.property.findMany({
    include: {
      landlord: { select: { id: true, name: true, email: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, 200, "All properties fetched successfully", properties);
});

/**
 * GET /api/admin/rentals - all rental requests platform-wide
 */
export const getAllRentals = asyncHandler(async (req: Request, res: Response) => {
  const rentals = await prisma.rentalRequest.findMany({
    include: {
      property: { select: { id: true, title: true, city: true, price: true } },
      tenant: { select: { id: true, name: true, email: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, 200, "All rental requests fetched successfully", rentals);
});
