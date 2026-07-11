import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { signToken } from "../utils/jwt";
import { RegisterInput, LoginInput } from "../validations/auth.validation";

function sanitizeUser<T extends { password: string }>(user: T) {
  const { password, ...rest } = user;
  return rest;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, phone, role },
  });

  const token = signToken({ id: user.id, role: user.role });

  return sendSuccess(res, 201, "Registration successful", {
    user: sanitizeUser(user),
    token,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.status === "BANNED") {
    throw ApiError.forbidden("Your account has been banned. Contact support.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ id: user.id, role: user.role });

  return sendSuccess(res, 200, "Login successful", {
    user: sanitizeUser(user),
    token,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return sendSuccess(res, 200, "Current user fetched", sanitizeUser(user));
});
