import {
  createOAuthState,
  parseOAuthState
} from "@/modules/marketing-ads/infrastructure/oauth-state";
import {
  requireTeamManager,
  requireTenantContext,
  requireUser
} from "@/lib/security/tenant-context";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { AuditRepository } from "@/shared/infrastructure/audit.repository";
import type { IntegrationProvider } from "@/shared/infrastructure/database.types";
import { GoogleProvider, type GoogleIntegrationProvider } from "../infrastructure/google.provider";
import { IntegrationRepository } from "../infrastructure/integration.repository";
import { MetaProvider } from "../infrastructure/meta.provider";
import { startIntegrationSchema, type StartIntegrationInput } from "./integration.schemas";

export class IntegrationService {
  private readonly integrations: IntegrationRepository;
  private readonly audit: AuditRepository;

  constructor(
    private readonly userClient: AppSupabaseClient,
    private readonly serviceClient: AppSupabaseClient
  ) {
    this.integrations = new IntegrationRepository(serviceClient);
    this.audit = new AuditRepository(serviceClient);
  }

  async list(tenantId: string): Promise<unknown[]> {
    const context = await requireTenantContext(this.userClient, tenantId);
    requireTeamManager(context);
    return this.integrations.list(context);
  }

  async createAuthorizationUrl(input: StartIntegrationInput): Promise<string> {
    const parsed = startIntegrationSchema.parse(input);
    const context = await requireTenantContext(this.userClient, parsed.tenantId);
    requireTeamManager(context);

    const state = createOAuthState({
      tenantId: context.tenantId,
      userId: context.userId,
      provider: parsed.provider
    });

    if (parsed.provider === "meta_ads") {
      return new MetaProvider().createAuthorizationUrl(state);
    }

    return new GoogleProvider().createAuthorizationUrl(
      parsed.provider as GoogleIntegrationProvider,
      state
    );
  }

  async completeGoogleCallback(code: string, state: string): Promise<unknown> {
    const oauthState = parseOAuthState(state);

    if (!["gmail", "google_calendar", "google_ads"].includes(oauthState.provider)) {
      throw new Error("OAuth state provider is not Google");
    }

    const context = await this.contextFromState(oauthState.tenantId, oauthState.userId);
    requireTeamManager(context);

    const tokenSet = await new GoogleProvider().exchangeCode(
      code,
      oauthState.provider as GoogleIntegrationProvider
    );
    const connection = await this.integrations.saveOAuthConnection(
      context,
      oauthState.provider,
      tokenSet
    );

    await this.audit.record(context, {
      action: "integration.connected",
      entityType: "integration_connection",
      entityId: (connection as { id: string }).id,
      after: {
        provider: oauthState.provider,
        displayName: tokenSet.displayName,
        scopes: tokenSet.scopes
      }
    });

    return connection;
  }

  async completeMetaCallback(code: string, state: string): Promise<unknown> {
    const oauthState = parseOAuthState(state);

    if (oauthState.provider !== "meta_ads") {
      throw new Error("OAuth state provider is not Meta");
    }

    const context = await this.contextFromState(oauthState.tenantId, oauthState.userId);
    requireTeamManager(context);

    const tokenSet = await new MetaProvider().exchangeCode(code);
    const connection = await this.integrations.saveOAuthConnection(context, "meta_ads", tokenSet);

    await this.audit.record(context, {
      action: "integration.connected",
      entityType: "integration_connection",
      entityId: (connection as { id: string }).id,
      after: {
        provider: "meta_ads",
        displayName: tokenSet.displayName,
        scopes: tokenSet.scopes
      }
    });

    return connection;
  }

  async disable(tenantId: string, connectionId: string): Promise<unknown> {
    const context = await requireTenantContext(this.userClient, tenantId);
    requireTeamManager(context);
    const connection = await this.integrations.disable(context, connectionId);

    await this.audit.record(context, {
      action: "integration.disabled",
      entityType: "integration_connection",
      entityId: connectionId,
      after: connection
    });

    return connection;
  }

  private async contextFromState(tenantId: string, userId: string) {
    const user = await requireUser(this.userClient);

    if (user.id !== userId) {
      throw new Error("OAuth state user does not match current session");
    }

    return requireTenantContext(this.userClient, tenantId);
  }
}

export function integrationProviderLabel(provider: IntegrationProvider): string {
  const labels: Record<IntegrationProvider, string> = {
    whatsapp: "WhatsApp",
    gmail: "Gmail",
    google_calendar: "Google Calendar",
    google_ads: "Google Ads",
    meta_ads: "Meta Ads",
    zonaprop: "Zonaprop",
    argenprop: "Argenprop",
    mercado_libre: "Mercado Libre Inmuebles"
  };

  return labels[provider];
}
