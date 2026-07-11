import { z } from "zod";

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "BANNED"], {
      errorMap: () => ({ message: "Status must be ACTIVE or BANNED" }),
    }),
  }),
  params: z.object({
    id: z.string().uuid("Invalid user id"),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
  }),
});
