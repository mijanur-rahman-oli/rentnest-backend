import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

type Role = "TENANT" | "LANDLORD" | "ADMIN";

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 * Usage: router.post("/", authenticate, authorize("LANDLORD"), handler)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        )
      );
    }
    next();
  };
}
