import { z } from "zod";

export const leadFiltersSchema = z.object({
  tenantId: z.string().uuid(),
  status: z
    .enum(["new", "contacted", "qualified", "unqualified", "converted", "lost", "reactivation"])
    .optional(),
  assignedAgentId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

const leadPayloadSchema = z.object({
  tenantId: z.string().uuid(),
  sourceId: z.string().uuid().optional(),
  assignedAgentId: z.string().uuid().optional(),
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  displayName: z.string().trim().min(1).max(240),
  email: z.string().email().optional(),
  phone: z.string().trim().max(80).optional(),
  preferredContactChannel: z.enum(["email", "phone", "whatsapp", "instagram", "other"]).optional(),
  operationType: z.enum(["sale", "rent", "temporary_rent"]).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  preferredLocations: z.array(z.string().trim().min(1)).default([]),
  propertyTypeInterest: z.string().trim().max(120).optional(),
  bedroomsMin: z.number().int().nonnegative().optional(),
  bathroomsMin: z.number().int().nonnegative().optional(),
  areaMin: z.number().nonnegative().optional(),
  notes: z.string().trim().max(5000).optional()
});

const validBudgetRange = (input: { budgetMin?: number; budgetMax?: number }) =>
  !input.budgetMax || !input.budgetMin || input.budgetMax >= input.budgetMin;

export const createLeadSchema = leadPayloadSchema.refine(validBudgetRange, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const createLeadBodySchema = leadPayloadSchema
  .omit({ tenantId: true })
  .refine(validBudgetRange, {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  });

export const updateLeadSchema = leadPayloadSchema
  .omit({ tenantId: true })
  .partial()
  .extend({
    status: z
      .enum(["new", "contacted", "qualified", "unqualified", "converted", "lost", "reactivation"])
      .optional(),
    score: z.number().int().min(0).max(100).optional(),
    nextFollowUpAt: z.string().datetime().optional().nullable(),
    lostReason: z.string().trim().max(500).optional().nullable()
  })
  .refine(validBudgetRange, {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  });

export type LeadFilters = z.infer<typeof leadFiltersSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
