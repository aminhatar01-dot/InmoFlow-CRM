# Integrations

## Google

Supported providers:

- Gmail.
- Google Calendar.
- Google Ads.

OAuth endpoint:

```text
GET /api/tenants/:tenantId/integrations/:provider/connect
```

Callback:

```text
GET /api/integrations/google/callback
```

Required env:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
GOOGLE_ADS_DEVELOPER_TOKEN
```

## Meta Ads

OAuth endpoint:

```text
GET /api/tenants/:tenantId/integrations/meta_ads/connect
```

Callback:

```text
GET /api/integrations/meta/callback
```

Required env:

```text
META_APP_ID
META_APP_SECRET
META_OAUTH_REDIRECT_URI
```

## WhatsApp

Webhook:

```text
GET /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

Required env:

```text
META_WEBHOOK_VERIFY_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```

## Token Storage

Tokens are encrypted before insert/update into:

```text
integration_tokens
```

Client-side code never reads this table.

## Provider API Versions

- Google Ads API v24.
- Meta Graph API v25.0.
- Gmail API `users.messages.send`.
- Google Calendar API `events.insert`.
