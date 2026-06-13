# API

## Health

```text
GET /api/health
```

## Tenants

```text
GET /api/tenants
POST /api/tenants
```

## Leads

```text
GET /api/tenants/:tenantId/leads
POST /api/tenants/:tenantId/leads
PATCH /api/tenants/:tenantId/leads/:leadId
```

## Properties

```text
GET /api/tenants/:tenantId/properties
POST /api/tenants/:tenantId/properties
PATCH /api/tenants/:tenantId/properties/:propertyId
```

## Tasks

```text
GET /api/tenants/:tenantId/tasks
POST /api/tenants/:tenantId/tasks
PATCH /api/tenants/:tenantId/tasks/:taskId
```

## Integrations

```text
GET /api/tenants/:tenantId/integrations
GET /api/tenants/:tenantId/integrations/:provider/connect
DELETE /api/tenants/:tenantId/integrations/:connectionId
```

OAuth callbacks:

```text
GET /api/integrations/google/callback
GET /api/integrations/meta/callback
```

WhatsApp webhooks:

```text
GET /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

## Error Format

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Request body validation failed",
    "details": {}
  }
}
```

## Request Validation

All JSON bodies and query strings are validated with Zod before reaching services.
