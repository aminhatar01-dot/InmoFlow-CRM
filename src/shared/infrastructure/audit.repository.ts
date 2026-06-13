import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/shared/domain/types";

export type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
};

export class AuditRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async record(context: TenantContext, input: AuditInput): Promise<void> {
    const { error } = await this.client.from("audit_logs").insert({
      tenant_id: context.tenantId,
      actor_user_id: context.userId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      before_redacted: input.before === undefined ? undefined : JSON.parse(JSON.stringify(input.before)),
      after_redacted: input.after === undefined ? undefined : JSON.parse(JSON.stringify(input.after)),
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      correlation_id: input.correlationId ?? null
    });

    if (error) {
      throw new Error(`Failed to write audit log: ${error.message}`);
    }
  }
}
