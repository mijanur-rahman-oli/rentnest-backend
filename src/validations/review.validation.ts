import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    rentalRequestId: z.string().uuid("Invalid rental request id"),
    rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5),
    comment: z.string().max(1000).optional(),
  }),
});
