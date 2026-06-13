import type { AppSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/security/tenant-context";
import { createTenantSchema, type CreateTenantInput } from "./tenant.schemas";
import { TenantRepository } from "../infrastructure/tenant.repository";

export class TenantService {
  private readonly tenants: TenantRepository;

  constructor(private readonly client: AppSupabaseClient) {
    this.tenants = new TenantRepository(client);
  }

  async listCurrentUserTenants(): Promise<unknown[]> {
    await requireUser(this.client);
    return this.tenants.listForCurrentUser();
  }

  async createTenant(input: CreateTenantInput): Promise<unknown> {
    const user = await requireUser(this.client);
    const parsed = createTenantSchema.parse(input);
    return this.tenants.createForUser(user.id, parsed);
  }
}
