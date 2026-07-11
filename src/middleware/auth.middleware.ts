import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { prisma } from "../config/db";

// Augment Express Request to carry the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies the Bearer JWT in the Authorization header, ensures the user
 * still exists and is not banned, and attaches { id, role } to req.user.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Authentication token missing");
    }

    const token = header.split(" ")[1];
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }
    if (user.status === "BANNED") {
      throw ApiError.forbidden("Your account has been banned");
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}
