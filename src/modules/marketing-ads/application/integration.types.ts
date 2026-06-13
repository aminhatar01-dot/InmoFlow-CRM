import type { IntegrationProvider } from "@/shared/infrastructure/database.types";

export type OAuthState = {
  tenantId: string;
  provider: IntegrationProvider;
  nonce: string;
  userId: string;
};

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
  externalAccountId?: string;
  displayName: string;
};

export type IntegrationConnectionSummary = {
  id: string;
  provider: IntegrationProvider;
  displayName: string;
  status: string;
  scopes: string[];
  connectedAt: string;
};
