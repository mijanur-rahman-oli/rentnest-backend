import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Centralized error handler. Every error in the app — thrown ApiErrors,
 * Prisma errors, Zod validation errors, or unexpected exceptions —
 * is normalized into the same JSON shape:
 * { success: false, message, errorDetails }
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Known, intentionally thrown application errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorDetails: err.errorDetails,
    });
  }

  // Zod validation errors (in case they slip past the validate middleware)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errorDetails: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Prisma known request errors (unique constraint, FK violation, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const message = mapPrismaError(err.code);
    return res.status(400).json({
      success: false,
      message,
      errorDetails: { code: err.code, meta: err.meta },
    });
  }

  // Fallback: unexpected error
  console.error("Unhandled error:", err);
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : message,
    errorDetails: null,
  });
}

function mapPrismaError(code: string): string {
  switch (code) {
    case "P2002":
      return "A record with this value already exists";
    case "P2003":
      return "Related record does not exist";
    case "P2025":
      return "Record not found";
    default:
      return "Database error";
  }
}
