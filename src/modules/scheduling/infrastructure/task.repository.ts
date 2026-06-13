import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/shared/domain/types";
import { unwrapSupabase, unwrapSupabaseList } from "@/shared/infrastructure/query";
import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from "../application/task.schemas";

export class TaskRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(context: TenantContext, filters: TaskFilters): Promise<unknown[]> {
    let query = this.client
      .from("tasks")
      .select("*")
      .eq("tenant_id", context.tenantId)
      .is("deleted_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.assignedTo) {
      query = query.eq("assigned_to", filters.assignedTo);
    }

    const { data, error } = await query;
    return unwrapSupabaseList(data, error);
  }

  async create(context: TenantContext, input: CreateTaskInput): Promise<unknown> {
    const { data, error } = await this.client
      .from("tasks")
      .insert({
        tenant_id: context.tenantId,
        lead_id: input.leadId ?? null,
        property_id: input.propertyId ?? null,
        opportunity_id: input.opportunityId ?? null,
        assigned_to: input.assignedTo ?? context.userId,
        created_by: context.userId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        due_at: input.dueAt ?? null
      })
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }

  async update(context: TenantContext, taskId: string, input: UpdateTaskInput): Promise<unknown> {
    const { data, error } = await this.client
      .from("tasks")
      .update({
        lead_id: input.leadId,
        property_id: input.propertyId,
        opportunity_id: input.opportunityId,
        assigned_to: input.assignedTo,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        due_at: input.dueAt,
        completed_at: input.completedAt
      })
      .eq("tenant_id", context.tenantId)
      .eq("id", taskId)
      .is("deleted_at", null)
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }
}
