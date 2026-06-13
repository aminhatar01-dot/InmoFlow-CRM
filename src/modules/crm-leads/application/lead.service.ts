import type { AppSupabaseClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/security/tenant-context";
import { AuditRepository } from "@/shared/infrastructure/audit.repository";
import { LeadRepository } from "../infrastructure/lead.repository";
import {
  createLeadSchema,
  leadFiltersSchema,
  updateLeadSchema,
  type CreateLeadInput,
  type LeadFilters,
  type UpdateLeadInput
} from "./lead.schemas";

export class LeadService {
  private readonly leads: LeadRepository;
  private readonly audit: AuditRepository;

  constructor(private readonly client: AppSupabaseClient) {
    this.leads = new LeadRepository(client);
    this.audit = new AuditRepository(client);
  }

  async list(filters: LeadFilters): Promise<unknown[]> {
    const parsed = leadFiltersSchema.parse(filters);
    const context = await requireTenantContext(this.client, parsed.tenantId);
    return this.leads.list(context, parsed);
  }

  async create(input: CreateLeadInput): Promise<unknown> {
    const parsed = createLeadSchema.parse(input);
    const context = await requireTenantContext(this.client, parsed.tenantId);
    const lead = await this.leads.create(context, parsed);

    await this.audit.record(context, {
      action: "lead.created",
      entityType: "lead",
      entityId: (lead as { id: string }).id,
      after: lead
    });

    return lead;
  }

  async update(tenantId: string, leadId: string, input: UpdateLeadInput): Promise<unknown> {
    const parsed = updateLeadSchema.parse(input);
    const context = await requireTenantContext(this.client, tenantId);
    const lead = await this.leads.update(context, leadId, parsed);

    await this.audit.record(context, {
      action: "lead.updated",
      entityType: "lead",
      entityId: leadId,
      after: lead
    });

    return lead;
  }
}
