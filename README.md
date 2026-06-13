# InmoFlow CRM

SaaS CRM inmobiliario enterprise, multi-tenant, construido con Next.js 15, TypeScript, TailwindCSS, Shadcn UI y Supabase.

## Estado

Fases completadas:

1. Arquitectura.
2. Estructura de carpetas.
3. Modelo de datos.
4. Esquema SQL Supabase.
5. Politicas RLS.
6. Backend.
7. Frontend.
8. Integraciones.
9. Despliegue GitHub -> Vercel.
10. Documentacion.

Validaciones locales verdes:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run build
```

Produccion Vercel:

- App: <https://inmoflow-crm-nine.vercel.app>
- Health: <https://inmoflow-crm-nine.vercel.app/api/health>

## Stack

- Next.js 15.
- TypeScript.
- TailwindCSS.
- Shadcn UI.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Supabase Edge Functions preparado.
- GitHub Actions.
- Vercel.

## Principios de seguridad

- Multi-tenancy estricto por `tenant_id`.
- RLS habilitado en todas las tablas publicas.
- Foreign keys compuestas por `tenant_id` en relaciones tenant-scoped.
- Repositories y services reciben `TenantContext`.
- Tokens externos cifrados con AES-256-GCM.
- OAuth state firmado con HMAC-SHA256.
- Rate limiting persistido.
- Auditoria de acciones sensibles.

## Herramientas locales disponibles

Supabase CLI:

```text
.tools/supabase/supabase.exe
```

Version:

```text
2.106.0
```

psql:

```text
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

Version:

```text
psql (PostgreSQL) 17.10
```

## Setup local

1. Crear `.env.local` desde `.env.example`.
2. Completar variables Supabase y claves de integraciones.
3. Instalar dependencias:

```bash
npm install
```

4. Ejecutar validaciones:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run build
```

5. Levantar Supabase local:

```bash
.tools/supabase/supabase.exe start
```

6. Levantar Next.js:

```bash
npm run dev
```

## Documentacion

- [Arquitectura](docs/architecture/ARCHITECTURE.md)
- [Setup local](docs/operations/LOCAL_SETUP.md)
- [Base de datos](docs/database/DATABASE.md)
- [Seguridad y multi-tenancy](docs/security/SECURITY_MULTI_TENANCY.md)
- [API](docs/operations/API.md)
- [Integraciones](docs/integrations/INTEGRATIONS.md)
- [Despliegue](docs/deployment/GITHUB_VERCEL_SUPABASE.md)
- [Runbook operativo](docs/operations/RUNBOOK.md)
- [Estado final](docs/operations/PROJECT_STATUS.md)
- [Handoff produccion](docs/operations/PRODUCTION_LAUNCH_HANDOFF.md)
