import type { AppSupabaseClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/security/tenant-context";
import { AuditRepository } from "@/shared/infrastructure/audit.repository";
import { PropertyRepository } from "../infrastructure/property.repository";
import {
  createPropertySchema,
  propertyFiltersSchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type PropertyFilters,
  type UpdatePropertyInput
} from "./property.schemas";

export class PropertyService {
  private readonly properties: PropertyRepository;
  private readonly audit: AuditRepository;

  constructor(private readonly client: AppSupabaseClient) {
    this.properties = new PropertyRepository(client);
    this.audit = new AuditRepository(client);
  }

  async list(filters: PropertyFilters): Promise<unknown[]> {
    const parsed = propertyFiltersSchema.parse(filters);
    const context = await requireTenantContext(this.client, parsed.tenantId);
    return this.properties.list(context, parsed);
  }

  async create(input: CreatePropertyInput): Promise<unknown> {
    const parsed = createPropertySchema.parse(input);
    const context = await requireTenantContext(this.client, parsed.tenantId);
    const property = await this.properties.create(context, parsed);

    await this.audit.record(context, {
      action: "property.created",
      entityType: "property",
      entityId: (property as { id: string }).id,
      after: property
    });

    return property;
  }

  async update(tenantId: string, propertyId: string, input: UpdatePropertyInput): Promise<unknown> {
    const parsed = updatePropertySchema.parse(input);
    const context = await requireTenantContext(this.client, tenantId);
    const property = await this.properties.update(context, propertyId, parsed);

    await this.audit.record(context, {
      action: "property.updated",
      entityType: "property",
      entityId: propertyId,
      after: property
    });

    return property;
  }
}
