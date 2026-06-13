# InmoFlow CRM - FASE 6 - Backend

## 1. Objetivo de la fase

Implementar la base backend productiva del SaaS sobre Next.js 15, TypeScript, Supabase, Zod, Clean Architecture, Repository Pattern y Service Layer.

Esta fase crea codigo real de backend. No implementa frontend visual, integraciones externas completas, webhooks productivos ni workflows ejecutables. Esas partes corresponden a fases posteriores.

## 2. Archivos principales generados

Configuracion:

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `.prettierrc.json`
- `.env.example`

Infraestructura backend:

- `src/config/env.ts`
- `src/lib/supabase/server.ts`
- `src/lib/security/tenant-context.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/observability/logger.ts`
- `src/lib/validation/request.ts`
- `src/shared/domain/errors.ts`
- `src/shared/domain/types.ts`
- `src/shared/infrastructure/database.types.ts`
- `src/shared/infrastructure/audit.repository.ts`
- `src/shared/infrastructure/query.ts`
- `src/shared/presentation/api-response.ts`

Modulos implementados:

- `identity-tenancy`
- `crm-leads`
- `properties`
- `scheduling`

Route handlers:

- `GET /api/health`
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/:tenantId/leads`
- `POST /api/tenants/:tenantId/leads`
- `PATCH /api/tenants/:tenantId/leads/:leadId`
- `GET /api/tenants/:tenantId/properties`
- `POST /api/tenants/:tenantId/properties`
- `PATCH /api/tenants/:tenantId/properties/:propertyId`
- `GET /api/tenants/:tenantId/tasks`
- `POST /api/tenants/:tenantId/tasks`
- `PATCH /api/tenants/:tenantId/tasks/:taskId`

## 3. Reglas backend aplicadas

### 3.1 Tenant isolation

Cada service resuelve `TenantContext` desde:

1. Usuario autenticado de Supabase Auth.
2. Membresia activa en `tenant_memberships`.
3. `tenantId` de la ruta.

Los repositories no operan datos de negocio sin `TenantContext`.

### 3.2 Validacion

Todas las entradas JSON y query params pasan por Zod antes de llegar a services o repositories.

### 3.3 Auditoria

Las mutaciones de leads, propiedades y tareas registran eventos en `audit_logs`.

### 3.4 Rate limiting

Los route handlers aplican rate limiting persistido en `rate_limit_events` mediante service role.

### 3.5 Supabase

Se crearon dos clientes server-side:

- Cliente SSR autenticado para operaciones del usuario y RLS.
- Cliente service role para operaciones privilegiadas de backend, como rate limiting.

### 3.6 Errores API

Los errores de dominio se devuelven con estructura consistente:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Request body validation failed",
    "details": {}
  }
}
```

## 4. Correccion RLS aplicada durante FASE 6

Se detecto que el alta inicial de un tenant podia crear el tenant, pero la creacion de la membresia Owner inicial quedaba bloqueada porque aun no existia ninguna membresia activa.

Se corrigio la migracion RLS agregando:

- `tenant_has_no_memberships(tenant_id)`.
- Politica `tenant_memberships_insert_initial_owner`.

La politica solo permite que el usuario autenticado cree su propia primera membresia `owner` activa cuando el tenant todavia no tiene miembros.

## 5. Variables de entorno necesarias

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=http://localhost:3000
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=120
```

## 6. Validacion realizada

Validaciones locales realizadas:

- Se confirmo que Node.js esta disponible.
- Se confirmo que npm esta disponible.
- Se busco codigo con TODOs, mocks, placeholders, simulaciones o integraciones falsas y no se encontraron coincidencias en `src`.
- Se reviso que los handlers pasen por services y que los services resuelvan `TenantContext`.
- Se corrigio la politica RLS necesaria para onboarding real.

## 7. Validacion pendiente

No se pudo ejecutar:

```text
npm install
npm run typecheck
npm run lint
```

Motivo:

`npm install` no completo dentro del timeout del entorno y no genero `node_modules` ni `package-lock.json`.

Cuando la red hacia npm este estable, ejecutar:

```text
npm install
npm run typecheck
npm run lint
```

Tambien queda pendiente aplicar migraciones contra una base Supabase real porque no estan instalados `psql` ni Supabase CLI en este entorno.

## 8. Criterios de cierre de FASE 6

FASE 6 queda completa cuando:

1. Existe configuracion backend TypeScript/Next.
2. Existe cliente Supabase server-side.
3. Existe resolucion de usuario y tenant activo.
4. Existen validaciones Zod.
5. Existen errores API consistentes.
6. Existen repositories y services iniciales.
7. Existen route handlers backend reales.
8. Existen auditoria y rate limiting.
9. No se generaron mocks, placeholders, funciones vacias ni integraciones falsas.

## 9. Estado

FASE 6 completada con validacion ejecutable pendiente por instalacion npm bloqueada.

Siguiente fase permitida: FASE 7 - Generar frontend.
