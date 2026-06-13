import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/shared/domain/types";
import { unwrapSupabase, unwrapSupabaseList } from "@/shared/infrastructure/query";
import type { CreateLeadInput, LeadFilters, UpdateLeadInput } from "../application/lead.schemas";

function normalizePhone(phone?: string): string | null {
  return phone ? phone.replace(/[^\d+]/g, "") : null;
}

function sanitizeSearchTerm(search: string): string {
  return search.replace(/[,%()]/g, " ").trim();
}

export class LeadRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(context: TenantContext, filters: LeadFilters): Promise<unknown[]> {
    let query = this.client
      .from("leads")
      .select("*")
      .eq("tenant_id", context.tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.assignedAgentId) {
      query = query.eq("assigned_agent_id", filters.assignedAgentId);
    }

    if (filters.search) {
      const search = sanitizeSearchTerm(filters.search);
      query = query.or(
        `display_name.ilike.%${search}%,email.ilike.%${search}%,normalized_phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    return unwrapSupabaseList(data, error);
  }

  async create(context: TenantContext, input: CreateLeadInput): Promise<unknown> {
    const { data, error } = await this.client
      .from("leads")
      .insert({
        tenant_id: context.tenantId,
        source_id: input.sourceId ?? null,
        assigned_agent_id: input.assignedAgentId ?? context.userId,
        first_name: input.firstName ?? null,
        last_name: input.lastName ?? null,
        display_name: input.displayName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        normalized_phone: normalizePhone(input.phone),
        preferred_contact_channel: input.preferredContactChannel ?? null,
        operation_type: input.operationType ?? null,
        budget_min: input.budgetMin ?? null,
        budget_max: input.budgetMax ?? null,
        currency: input.currency ?? null,
        preferred_locations: input.preferredLocations,
        property_type_interest: input.propertyTypeInterest ?? null,
        bedrooms_min: input.bedroomsMin ?? null,
        bathrooms_min: input.bathroomsMin ?? null,
        area_min: input.areaMin ?? null,
        notes: input.notes ?? null,
        created_by: context.userId,
        updated_by: context.userId
      })
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }

  async update(context: TenantContext, leadId: string, input: UpdateLeadInput): Promise<unknown> {
    const { data, error } = await this.client
      .from("leads")
      .update({
        source_id: input.sourceId,
        assigned_agent_id: input.assignedAgentId,
        status: input.status,
        first_name: input.firstName,
        last_name: input.lastName,
        display_name: input.displayName,
        email: input.email,
        phone: input.phone,
        normalized_phone: input.phone === undefined ? undefined : normalizePhone(input.phone),
        preferred_contact_channel: input.preferredContactChannel,
        operation_type: input.operationType,
        budget_min: input.budgetMin,
        budget_max: input.budgetMax,
        currency: input.currency,
        preferred_locations: input.preferredLocations,
        property_type_interest: input.propertyTypeInterest,
        bedrooms_min: input.bedroomsMin,
        bathrooms_min: input.bathroomsMin,
        area_min: input.areaMin,
        notes: input.notes,
        score: input.score,
        next_follow_up_at: input.nextFollowUpAt,
        lost_reason: input.lostReason,
        updated_by: context.userId
      })
      .eq("tenant_id", context.tenantId)
      .eq("id", leadId)
      .is("deleted_at", null)
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }
}
