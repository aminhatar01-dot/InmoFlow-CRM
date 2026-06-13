import type { AppSupabaseClient } from "@/lib/supabase/server";
import { unwrapSupabase, unwrapSupabaseList } from "@/shared/infrastructure/query";
import type { TenantContext } from "@/shared/domain/types";
import type { CreateTenantInput } from "@/modules/identity-tenancy/application/tenant.schemas";

export class TenantRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listForCurrentUser(): Promise<unknown[]> {
    const { data, error } = await this.client
      .from("tenants")
      .select("id,name,slug,logo_url,country,timezone,default_currency,created_at,updated_at")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    return unwrapSupabaseList(data, error);
  }

  async createForUser(userId: string, input: CreateTenantInput): Promise<unknown> {
    const { data: tenant, error: tenantError } = await this.client
      .from("tenants")
      .insert({
        name: input.name,
        slug: input.slug,
        legal_name: input.legalName ?? null,
        tax_id: input.taxId ?? null,
        primary_email: input.primaryEmail ?? null,
        primary_phone: input.primaryPhone ?? null,
        country: input.country,
        region: input.region ?? null,
        city: input.city ?? null,
        timezone: input.timezone,
        default_currency: input.defaultCurrency
      })
      .select("*")
      .single();

    const createdTenant = unwrapSupabase(tenant, tenantError);

    const tenantId = (createdTenant as { id: string }).id;
    const { error: membershipError } = await this.client.from("tenant_memberships").insert({
      tenant_id: tenantId,
      user_id: userId,
      role: "owner",
      status: "active",
      joined_at: new Date().toISOString()
    });

    if (membershipError) {
      throw new Error(`Failed to create owner membership: ${membershipError.message}`);
    }

    return createdTenant;
  }

  async getById(context: TenantContext): Promise<unknown> {
    const { data, error } = await this.client
      .from("tenants")
      .select("*")
      .eq("id", context.tenantId)
      .is("deleted_at", null)
      .single();

    return unwrapSupabase(data, error);
  }
}
