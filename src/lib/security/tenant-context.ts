import type { AppSupabaseClient } from "@/lib/supabase/server";
import { AuthenticationError, AuthorizationError } from "@/shared/domain/errors";
import type { AppRole, TenantContext } from "@/shared/domain/types";

export async function requireUser(
  client: AppSupabaseClient
): Promise<{ id: string; email?: string }> {
  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return {
    id: user.id,
    email: user.email ?? undefined
  };
}

export async function requireTenantContext(
  client: AppSupabaseClient,
  tenantId: string
): Promise<TenantContext> {
  const user = await requireUser(client);

  const { data, error } = await client
    .from("tenant_memberships")
    .select("tenant_id,user_id,role,status")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (error || !data) {
    throw new AuthorizationError("Active tenant membership is required");
  }

  return {
    tenantId: data.tenant_id,
    userId: data.user_id,
    role: data.role
  };
}

export function requireAnyRole(context: TenantContext, allowedRoles: AppRole[]): void {
  if (!allowedRoles.includes(context.role)) {
    throw new AuthorizationError("The current role cannot perform this action");
  }
}

export function canManageTeam(context: TenantContext): boolean {
  return ["owner", "admin", "manager"].includes(context.role);
}

export function requireTeamManager(context: TenantContext): void {
  requireAnyRole(context, ["owner", "admin", "manager"]);
}

export function requireTenantManager(context: TenantContext): void {
  requireAnyRole(context, ["owner", "admin"]);
}
