import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/shared/domain/types";
import { unwrapSupabase, unwrapSupabaseList } from "@/shared/infrastructure/query";
import type {
  CreatePropertyInput,
  PropertyFilters,
  UpdatePropertyInput
} from "../application/property.schemas";

export class PropertyRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(context: TenantContext, filters: PropertyFilters): Promise<unknown[]> {
    let query = this.client
      .from("properties")
      .select("*")
      .eq("tenant_id", context.tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.operationType) {
      query = query.eq("operation_type", filters.operationType);
    }

    if (filters.propertyType) {
      query = query.eq("property_type", filters.propertyType);
    }

    if (filters.search) {
      const search = filters.search.replace(/[,%()]/g, " ").trim();
      query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, error } = await query;
    return unwrapSupabaseList(data, error);
  }

  async create(context: TenantContext, input: CreatePropertyInput): Promise<unknown> {
    const { data, error } = await this.client
      .from("properties")
      .insert({
        tenant_id: context.tenantId,
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        property_type: input.propertyType,
        operation_type: input.operationType,
        status: input.status,
        owner_name: input.ownerName ?? null,
        owner_contact: input.ownerContact ?? null,
        internal_notes: input.internalNotes ?? null,
        featured: input.featured,
        created_by: context.userId,
        updated_by: context.userId
      })
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }

  async update(
    context: TenantContext,
    propertyId: string,
    input: UpdatePropertyInput
  ): Promise<unknown> {
    const { data, error } = await this.client
      .from("properties")
      .update({
        code: input.code,
        title: input.title,
        description: input.description,
        property_type: input.propertyType,
        operation_type: input.operationType,
        status: input.status,
        owner_name: input.ownerName,
        owner_contact: input.ownerContact,
        internal_notes: input.internalNotes,
        featured: input.featured,
        updated_by: context.userId
      })
      .eq("tenant_id", context.tenantId)
      .eq("id", propertyId)
      .is("deleted_at", null)
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }
}
