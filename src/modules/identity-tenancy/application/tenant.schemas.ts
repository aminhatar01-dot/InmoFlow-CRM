import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  legalName: z.string().trim().max(200).optional(),
  taxId: z.string().trim().max(80).optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().trim().max(60).optional(),
  country: z.string().trim().length(2).default("AR"),
  region: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  timezone: z.string().trim().min(1).default("America/Argentina/Buenos_Aires"),
  defaultCurrency: z.string().trim().length(3).default("ARS")
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
