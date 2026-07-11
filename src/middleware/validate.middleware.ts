import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Generic request validator. Pass a Zod schema shaped like:
 * z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })
 * Only the parts you define are validated/replaced; the rest pass through.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errorDetails: err.issues.map((i) => ({
            field: i.path.slice(1).join(".") || i.path.join("."),
            message: i.message,
          })),
        });
      }
      next(err);
    }
  };
}
