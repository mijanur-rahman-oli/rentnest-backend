import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

/**
 * GET /api/categories - public
 */
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return sendSuccess(res, 200, "Categories fetched successfully", categories);
});

/**
 * POST /api/admin/categories - admin only
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-");

  const existing = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (existing) {
    throw ApiError.conflict("A category with this name already exists");
  }

  const category = await prisma.category.create({ data: { name, slug } });
  return sendSuccess(res, 201, "Category created successfully", category);
});
