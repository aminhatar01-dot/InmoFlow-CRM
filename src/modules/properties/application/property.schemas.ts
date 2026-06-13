import { z } from "zod";

export const propertyFiltersSchema = z.object({
  tenantId: z.string().uuid(),
  status: z
    .enum(["draft", "available", "reserved", "sold", "rented", "paused", "archived"])
    .optional(),
  operationType: z.enum(["sale", "rent", "temporary_rent"]).optional(),
  propertyType: z.string().trim().min(1).max(120).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const createPropertySchema = z.object({
  tenantId: z.string().uuid(),
  code: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(10000).optional(),
  propertyType: z.string().trim().min(1).max(120),
  operationType: z.enum(["sale", "rent", "temporary_rent"]),
  status: z.enum(["draft", "available", "reserved", "sold", "rented", "paused", "archived"]).default("draft"),
  ownerName: z.string().trim().max(200).optional(),
  ownerContact: z.string().trim().max(200).optional(),
  internalNotes: z.string().trim().max(5000).optional(),
  featured: z.boolean().default(false)
});

export const updatePropertySchema = createPropertySchema.omit({ tenantId: true }).partial();

export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
