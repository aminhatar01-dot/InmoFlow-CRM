# Database

## Migrations

Initial schema:

```text
supabase/migrations/20260613000000_initial_schema.sql
```

RLS policies:

```text
supabase/migrations/20260613001000_rls_policies.sql
```

## Extensions

- `pgcrypto`
- `citext`
- `vector`

## Tables

The schema contains 64 public tables.

Major groups:

- Identity and tenancy.
- CRM leads.
- Sales pipeline.
- Properties.
- Portfolio sharing.
- Scheduling.
- Communications.
- Automation workflows.
- AI.
- Documents.
- Marketing and ads.
- Publishing.
- Audit, logs and analytics.

## Tenant Isolation

Tenant-scoped tables include:

```text
tenant_id uuid not null
unique (tenant_id, id)
```

Tenant-scoped relationships use composite foreign keys:

```text
foreign key (tenant_id, resource_id) references public.resources(tenant_id, id)
```

## RLS

All 64 public tables have RLS enabled.

RLS helpers:

- `is_tenant_member`.
- `has_tenant_role`.
- `has_tenant_permission`.
- `can_manage_tenant`.
- `can_manage_team`.
- `tenant_has_no_memberships`.
- `storage_tenant_id`.

## Applying Migrations

Local:

```bash
.tools/supabase/supabase.exe db reset
```

Production:

```bash
supabase db push
```

Production deploy is configured in:

```text
.github/workflows/deploy-supabase.yml
```
