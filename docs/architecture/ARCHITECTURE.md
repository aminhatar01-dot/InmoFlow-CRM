# Architecture

## Overview

InmoFlow CRM is a modular monolith SaaS built on Next.js and Supabase.

The codebase follows:

- Clean Architecture.
- DDD bounded contexts.
- Repository Pattern.
- Service Layer.
- Tenant-scoped data access.

## Layers

```text
src/app                         Next.js App Router and API routes
src/components                  Shared UI
src/lib                         Cross-cutting infrastructure
src/shared                      Shared domain, infrastructure and presentation utilities
src/modules/*/domain            Domain model
src/modules/*/application       Use cases, schemas, services
src/modules/*/infrastructure    Repositories and external providers
src/modules/*/presentation      UI components per module
```

## Implemented Modules

- `identity-tenancy`
- `crm-leads`
- `properties`
- `scheduling`
- `communications`
- `marketing-ads`

## Tenant Context

Every business operation resolves:

- `tenantId`
- `userId`
- `role`

from Supabase Auth and `tenant_memberships`.

The frontend may pass a tenant id in the route, but the backend verifies membership server-side.

## Data Access

Repositories must receive `TenantContext` before accessing tenant-scoped tables.

Queries explicitly filter by:

```text
tenant_id = context.tenantId
```

RLS is the database-level safety boundary.

## External Integrations

Integrations are provider-based:

- Google Provider.
- Meta Provider.
- WhatsApp Provider.

Tokens are stored encrypted. The client never receives provider tokens.
