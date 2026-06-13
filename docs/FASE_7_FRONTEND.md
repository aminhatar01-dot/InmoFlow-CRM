# InmoFlow CRM - FASE 7 - Frontend

## 1. Objetivo de la fase

Implementar el frontend base productivo del CRM con Next.js 15, TypeScript, TailwindCSS y Shadcn UI, conectado al backend real de FASE 6 y respetando multi-tenancy.

Esta fase no implementa integraciones externas completas, workflows visuales avanzados ni despliegue. Esas partes corresponden a fases posteriores.

## 2. Frontend implementado

Configuracion UI:

- `tailwind.config.ts`
- `postcss.config.mjs`
- `components.json`
- `src/app/globals.css`
- `src/lib/utils.ts`

Componentes Shadcn UI locales:

- `Button`
- `Input`
- `Label`
- `Textarea`
- `Card`
- `Badge`
- `Table`

Layout:

- `src/components/layout/app-shell.tsx`
- `src/components/layout/page-header.tsx`

Autenticacion:

- `GET /auth/login/google`
- `GET /auth/callback`
- `POST /auth/logout`
- `src/app/(auth)/login/page.tsx`

Pantallas:

- Dashboard autenticado.
- Onboarding de tenant.
- Listado y creacion de leads.
- Listado y creacion de inmuebles.
- Listado y creacion de tareas.

## 3. Rutas frontend

```text
/login
/
/tenants/:tenantId/leads
/tenants/:tenantId/properties
/tenants/:tenantId/tasks
```

## 4. Reglas de seguridad aplicadas

- El layout autenticado redirige a `/login` si no hay usuario Supabase.
- Las lecturas server-side filtran explicitamente por `tenant_id`.
- Las mutaciones usan los API handlers de FASE 6.
- Los API handlers resuelven `TenantContext` server-side y aplican RLS.
- No se aceptan datos de otro tenant desde formularios.
- Google OAuth usa Supabase Auth real.

## 5. Instalacion de herramientas solicitadas

### Supabase CLI

Instalado localmente en:

```text
.tools/supabase/supabase.exe
```

Version verificada:

```text
2.106.0
```

La carpeta `.tools/` queda ignorada por Git.

### psql

Disponible por ruta absoluta:

```text
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

Version verificada:

```text
psql (PostgreSQL) 17.10
```

Tambien existe PostgreSQL 18 en:

```text
C:\Program Files\PostgreSQL\18\bin\psql.exe
```

## 6. Migraciones Supabase

Se ejecuto `supabase init` y se creo `supabase/config.toml`.

Se ajustaron puertos locales a `545xx` para no interferir con otros proyectos Supabase que ya estaban corriendo en Docker.

Durante `supabase start`, Supabase aplico correctamente:

- `20260613000000_initial_schema.sql`
- `20260613001000_rls_policies.sql`

El arranque completo fallo despues por healthcheck de Storage en Windows:

```text
supabase_storage_InmoFlow_CRM container is not ready: unhealthy
```

Esto ocurrio despues de aplicar migraciones. Tambien se mostro una advertencia de Supabase sobre Analytics en Windows y Docker daemon expuesto en `tcp://localhost:2375`.

## 7. Validacion pendiente

No se pudo ejecutar:

```text
npm install
npm run typecheck
npm run lint
```

Motivo:

`npm install` y `npm ping` quedaron colgados por timeout contra el registro npm y no generaron `node_modules` ni `package-lock.json`.

Cuando npm responda:

```text
npm install
npm run typecheck
npm run lint
npm run dev
```

## 8. Criterios de cierre de FASE 7

FASE 7 queda completa cuando:

1. Existe frontend Next.js con TailwindCSS.
2. Existen componentes Shadcn UI reales.
3. Existe login Google mediante Supabase Auth.
4. Existe shell autenticado.
5. Existe dashboard operativo.
6. Existen pantallas para leads, inmuebles y tareas.
7. Las mutaciones consumen backend real.
8. No se generaron mocks, placeholders, funciones vacias ni integraciones falsas.

## 9. Estado

FASE 7 completada con validacion npm pendiente por timeout del registro.

Siguiente fase permitida: FASE 8 - Generar integraciones.
