# Security and Multi-Tenancy

## Core Rules

1. Every business entity is tenant-scoped.
2. Every business query filters by `tenant_id`.
3. RLS is enabled on all public tables.
4. Users must have active membership in a tenant.
5. Client-side tenant selection is never trusted by itself.

## Roles

- Owner.
- Admin.
- Manager.
- Agent.

## Authorization

Authorization exists in two layers:

- Database RLS.
- Application services.

Application services use:

```text
requireTenantContext()
requireTeamManager()
requireTenantManager()
```

## Token Security

External integration tokens are encrypted with:

```text
AES-256-GCM
```

The encryption key comes from:

```text
INTEGRATION_TOKEN_ENCRYPTION_KEY
```

Tokens are stored in:

```text
integration_tokens
```

RLS blocks client access to that table.

## OAuth State

OAuth state is signed with HMAC-SHA256 and includes:

- Tenant id.
- User id.
- Provider.
- Nonce.

Callbacks reject mismatched users or invalid signatures.

## Rate Limiting

Rate limit events are stored in:

```text
rate_limit_events
```

Client access is blocked by RLS. Server-side route handlers write through service role.

## Audit Logs

Sensitive actions write to:

```text
audit_logs
```

Implemented audit events include:

- Lead created/updated.
- Property created/updated.
- Task created/updated.
- Integration connected/disabled.

## Storage

Storage paths must follow:

```text
tenant/{tenant_id}/{resource_type}/{resource_id}/{file_name}
```
