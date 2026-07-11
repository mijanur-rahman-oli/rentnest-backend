import { z } from "zod";

export const createRentalRequestSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid("Invalid property id"),
    moveInDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
      message: "moveInDate must be a valid date",
    }),
    durationMonths: z.number().int().positive().optional(),
    message: z.string().max(1000).optional(),
  }),
});

export const updateRentalRequestStatusSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"], {
      errorMap: () => ({ message: "Status must be APPROVED or REJECTED" }),
    }),
    rejectReason: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid rental request id"),
  }),
});

export const rentalRequestIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid rental request id"),
  }),
});
