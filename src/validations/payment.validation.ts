import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z.object({
    rentalRequestId: z.string().uuid("Invalid rental request id"),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "sessionId is required"),
  }),
});
