import { requireEnvValue } from "@/config/env";
import { AppError } from "@/shared/domain/errors";
import type { OAuthTokenSet } from "../application/integration.types";

const metaOAuthUrl = "https://www.facebook.com/v25.0/dialog/oauth";
const metaTokenUrl = "https://graph.facebook.com/v25.0/oauth/access_token";
const metaMeUrl = "https://graph.facebook.com/v25.0/me";
const metaAdAccountsUrl = "https://graph.facebook.com/v25.0/me/adaccounts";

const metaScopes = ["ads_management", "ads_read", "business_management", "pages_read_engagement"];

export class MetaProvider {
  createAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: requireEnvValue("META_APP_ID"),
      redirect_uri: requireEnvValue("META_OAUTH_REDIRECT_URI"),
      response_type: "code",
      scope: metaScopes.join(","),
      state
    });

    return `${metaOAuthUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenSet> {
    const response = await fetch(
      `${metaTokenUrl}?${new URLSearchParams({
        client_id: requireEnvValue("META_APP_ID"),
        client_secret: requireEnvValue("META_APP_SECRET"),
        redirect_uri: requireEnvValue("META_OAUTH_REDIRECT_URI"),
        code
      }).toString()}`
    );

    if (!response.ok) {
      throw new AppError(502, "meta_token_exchange_failed", await response.text());
    }

    const token = (await response.json()) as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
    };

    const account = await this.getCurrentAccount(token.access_token);

    return {
      accessToken: token.access_token,
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : undefined,
      scopes: metaScopes,
      externalAccountId: account.id,
      displayName: account.name ? `Meta Ads: ${account.name}` : "Meta Ads"
    };
  }

  private async getCurrentAccount(accessToken: string): Promise<{ id?: string; name?: string }> {
    const response = await fetch(
      `${metaMeUrl}?${new URLSearchParams({ fields: "id,name", access_token: accessToken }).toString()}`
    );

    if (!response.ok) {
      return {};
    }

    return (await response.json()) as { id?: string; name?: string };
  }

  async listAdAccounts(accessToken: string): Promise<{
    data: Array<{ id: string; name: string; account_status: number; currency?: string }>;
  }> {
    const response = await fetch(
      `${metaAdAccountsUrl}?${new URLSearchParams({
        fields: "id,name,account_status,currency",
        access_token: accessToken
      }).toString()}`
    );

    if (!response.ok) {
      throw new AppError(502, "meta_ad_accounts_failed", await response.text());
    }

    return (await response.json()) as {
      data: Array<{ id: string; name: string; account_status: number; currency?: string }>;
    };
  }
}
