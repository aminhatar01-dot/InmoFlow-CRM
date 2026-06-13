import { z } from "zod";

export const taskFiltersSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  assignedTo: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const createTaskSchema = z.object({
  tenantId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(5000).optional(),
  priority: z.number().int().min(1).max(5).default(3),
  dueAt: z.string().datetime().optional()
});

export const updateTaskSchema = createTaskSchema
  .omit({ tenantId: true })
  .partial()
  .extend({
    status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
    completedAt: z.string().datetime().optional().nullable()
  });

export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
