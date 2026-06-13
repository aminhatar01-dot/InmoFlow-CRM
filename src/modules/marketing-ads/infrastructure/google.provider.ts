import { requireEnvValue } from "@/config/env";
import { AppError } from "@/shared/domain/errors";
import type { OAuthTokenSet } from "../application/integration.types";

const googleOAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleTokenInfoUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo";
const gmailProfileUrl = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
const gmailSendUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const calendarEventsUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const googleAdsAccessibleCustomersUrl =
  "https://googleads.googleapis.com/v24/customers:listAccessibleCustomers";

const googleScopesByProvider = {
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send"
  ],
  google_calendar: ["https://www.googleapis.com/auth/calendar.events"],
  google_ads: ["https://www.googleapis.com/auth/adwords"]
} as const;

export type GoogleIntegrationProvider = keyof typeof googleScopesByProvider;

export class GoogleProvider {
  createAuthorizationUrl(provider: GoogleIntegrationProvider, state: string): string {
    const params = new URLSearchParams({
      client_id: requireEnvValue("GOOGLE_OAUTH_CLIENT_ID"),
      redirect_uri: requireEnvValue("GOOGLE_OAUTH_REDIRECT_URI"),
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: googleScopesByProvider[provider].join(" "),
      state
    });

    return `${googleOAuthUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string, provider: GoogleIntegrationProvider): Promise<OAuthTokenSet> {
    const response = await fetch(googleTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: requireEnvValue("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: requireEnvValue("GOOGLE_OAUTH_CLIENT_SECRET"),
        redirect_uri: requireEnvValue("GOOGLE_OAUTH_REDIRECT_URI"),
        grant_type: "authorization_code"
      })
    });

    if (!response.ok) {
      throw new AppError(502, "google_token_exchange_failed", await response.text());
    }

    const token = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    const tokenInfo = await this.getTokenInfo(token.access_token);

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : undefined,
      scopes: token.scope?.split(" ") ?? [...googleScopesByProvider[provider]],
      externalAccountId: tokenInfo.email,
      displayName: tokenInfo.email ? `Google ${provider}: ${tokenInfo.email}` : `Google ${provider}`
    };
  }

  private async getTokenInfo(accessToken: string): Promise<{ email?: string }> {
    const response = await fetch(
      `${googleTokenInfoUrl}?access_token=${encodeURIComponent(accessToken)}`
    );

    if (!response.ok) {
      return {};
    }

    return (await response.json()) as { email?: string };
  }

  async getGmailProfile(
    accessToken: string
  ): Promise<{ emailAddress: string; messagesTotal: number }> {
    const response = await fetch(gmailProfileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new AppError(502, "gmail_profile_failed", await response.text());
    }

    return (await response.json()) as { emailAddress: string; messagesTotal: number };
  }

  async sendGmailMessage(input: {
    accessToken: string;
    to: string;
    subject: string;
    bodyText: string;
  }): Promise<{ id: string; threadId: string }> {
    const raw = Buffer.from(
      [
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        input.bodyText
      ].join("\r\n")
    )
      .toString("base64url")
      .replace(/=+$/, "");

    const response = await fetch(gmailSendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      throw new AppError(502, "gmail_send_failed", await response.text());
    }

    return (await response.json()) as { id: string; threadId: string };
  }

  async createCalendarEvent(input: {
    accessToken: string;
    summary: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    attendeeEmail?: string;
  }): Promise<{ id: string; htmlLink: string }> {
    const response = await fetch(calendarEventsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startsAt, timeZone: input.timezone },
        end: { dateTime: input.endsAt, timeZone: input.timezone },
        attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined
      })
    });

    if (!response.ok) {
      throw new AppError(502, "google_calendar_event_create_failed", await response.text());
    }

    return (await response.json()) as { id: string; htmlLink: string };
  }

  async listAccessibleGoogleAdsCustomers(
    accessToken: string
  ): Promise<{ resourceNames: string[] }> {
    const response = await fetch(googleAdsAccessibleCustomersUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": requireEnvValue("GOOGLE_ADS_DEVELOPER_TOKEN")
      }
    });

    if (!response.ok) {
      throw new AppError(502, "google_ads_customers_failed", await response.text());
    }

    return (await response.json()) as { resourceNames: string[] };
  }
}
