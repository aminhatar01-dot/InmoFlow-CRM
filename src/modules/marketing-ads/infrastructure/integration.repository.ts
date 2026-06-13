import { encryptSecret } from "@/lib/security/encryption";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/shared/domain/types";
import type { IntegrationProvider } from "@/shared/infrastructure/database.types";
import { unwrapSupabase, unwrapSupabaseList } from "@/shared/infrastructure/query";
import type { OAuthTokenSet } from "../application/integration.types";

export class IntegrationRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(context: TenantContext): Promise<unknown[]> {
    const { data, error } = await this.client
      .from("integration_connections")
      .select("id,provider,display_name,status,scopes,connected_at,last_error")
      .eq("tenant_id", context.tenantId)
      .order("connected_at", { ascending: false });

    return unwrapSupabaseList(data, error);
  }

  async saveOAuthConnection(
    context: TenantContext,
    provider: IntegrationProvider,
    tokenSet: OAuthTokenSet
  ): Promise<unknown> {
    const { data: connection, error } = await this.client
      .from("integration_connections")
      .upsert(
        {
          tenant_id: context.tenantId,
          provider,
          display_name: tokenSet.displayName,
          external_account_id: tokenSet.externalAccountId ?? null,
          status: "connected",
          scopes: tokenSet.scopes,
          connected_by: context.userId,
          connected_at: new Date().toISOString(),
          last_error: null
        },
        {
          onConflict: "tenant_id,provider,external_account_id"
        }
      )
      .select("*")
      .single();

    const savedConnection = unwrapSupabase(connection, error) as { id: string };

    const { error: tokenError } = await this.client.from("integration_tokens").upsert(
      {
        tenant_id: context.tenantId,
        connection_id: savedConnection.id,
        access_token_encrypted: encryptSecret(tokenSet.accessToken),
        refresh_token_encrypted: tokenSet.refreshToken ? encryptSecret(tokenSet.refreshToken) : null,
        expires_at: tokenSet.expiresAt ?? null,
        rotation_required_at: null
      },
      {
        onConflict: "tenant_id,connection_id"
      }
    );

    if (tokenError) {
      throw new Error(`Failed to persist integration token: ${tokenError.message}`);
    }

    return savedConnection;
  }

  async disable(context: TenantContext, connectionId: string): Promise<unknown> {
    const { data, error } = await this.client
      .from("integration_connections")
      .update({ status: "disabled" })
      .eq("tenant_id", context.tenantId)
      .eq("id", connectionId)
      .select("*")
      .single();

    return unwrapSupabase(data, error);
  }
}
