import { z } from "zod";

const propertyTypeEnum = z.enum([
  "APARTMENT",
  "HOUSE",
  "STUDIO",
  "ROOM",
  "VILLA",
  "OFFICE",
]);

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string().min(3).max(150),
    description: z.string().min(10),
    type: propertyTypeEnum,
    price: z.number().positive("Price must be greater than 0"),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    areaSqft: z.number().positive().optional(),
    address: z.string().min(3),
    city: z.string().min(2),
    region: z.string().optional(),
    country: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url("Each image must be a valid URL")).optional(),
    categoryId: z.string().uuid("Invalid category id").optional(),
  }),
});

export const updatePropertySchema = z.object({
  body: createPropertySchema.shape.body.partial().extend({
    status: z.enum(["AVAILABLE", "UNAVAILABLE", "RENTED"]).optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid property id"),
  }),
});

export const propertyIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid property id"),
  }),
});

export const propertyQuerySchema = z.object({
  query: z.object({
    city: z.string().optional(),
    type: propertyTypeEnum.optional(),
    minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    amenities: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
