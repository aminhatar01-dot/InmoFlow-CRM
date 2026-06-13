# InmoFlow CRM - FASE 2 - Estructura de Carpetas

## 1. Objetivo de la fase

Crear la estructura base del repositorio para soportar un SaaS CRM inmobiliario enterprise con Next.js 15, TypeScript, TailwindCSS, Shadcn UI, Supabase, Clean Architecture, DDD, Repository Pattern, Service Layer y multi-tenancy estricto.

Esta fase no implementa codigo de aplicacion, SQL, migraciones, pantallas, integraciones, workflows ni configuraciones de despliegue. Solo define y crea la organizacion fisica del proyecto.

## 2. Estructura creada

```text
.
|-- .github/
|   `-- workflows/
|-- docs/
|   |-- architecture/
|   |-- database/
|   |-- deployment/
|   |-- integrations/
|   |-- operations/
|   `-- security/
|-- scripts/
|-- src/
|   |-- app/
|   |   |-- (auth)/
|   |   |-- (dashboard)/
|   |   |-- (public)/
|   |   `-- api/
|   |-- components/
|   |   |-- layout/
|   |   `-- ui/
|   |-- config/
|   |-- lib/
|   |   |-- observability/
|   |   |-- security/
|   |   |-- supabase/
|   |   `-- validation/
|   |-- modules/
|   |   |-- ai/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- analytics/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- automation-workflows/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- communications/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- crm-leads/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- documents/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- identity-tenancy/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- marketing-ads/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- portfolio-sharing/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- properties/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- publishing/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   |-- sales-pipeline/
|   |   |   |-- application/
|   |   |   |-- domain/
|   |   |   |-- infrastructure/
|   |   |   `-- presentation/
|   |   `-- scheduling/
|   |       |-- application/
|   |       |-- domain/
|   |       |-- infrastructure/
|   |       `-- presentation/
|   `-- shared/
|       |-- application/
|       |-- domain/
|       |-- infrastructure/
|       `-- presentation/
|-- supabase/
|   |-- functions/
|   |   |-- jobs/
|   |   `-- webhooks/
|   |-- migrations/
|   `-- seed/
`-- tests/
    |-- e2e/
    |-- integration/
    |-- rls/
    |-- security/
    `-- unit/
```

## 3. Reglas por carpeta

### `.github/workflows`

Reservada para workflows de GitHub Actions. Se usara en FASE 9 para CI/CD, validaciones y despliegue GitHub -> Vercel.

### `docs`

Documentacion del sistema, decisiones arquitectonicas, modelo de datos, seguridad, operaciones, integraciones y despliegue.

### `scripts`

Automatizaciones locales o de CI verificables. No debe contener scripts que creen datos falsos de negocio ni flujos simulados.

### `src/app`

Rutas Next.js 15 App Router.

- `(auth)`: login, callback OAuth, onboarding y seleccion de tenant.
- `(dashboard)`: aplicacion autenticada y tenant-scoped.
- `(public)`: superficies publicas controladas, como portafolios compartibles.
- `api`: route handlers server-side para webhooks, BFF y endpoints que requieran HTTP.

### `src/components`

Componentes compartidos de UI.

- `ui`: componentes Shadcn UI.
- `layout`: navegacion, shells, barras laterales y composicion visual transversal.

Los componentes especificos de un dominio viven en `src/modules/<module>/presentation`.

### `src/config`

Configuracion tipada de runtime, variables de entorno y feature flags reales.

### `src/lib`

Infraestructura transversal.

- `supabase`: clientes Supabase por contexto de ejecucion.
- `security`: autorizacion, rate limiting, headers, cifrado y controles OWASP.
- `validation`: esquemas Zod compartidos.
- `observability`: logging, correlation IDs y metricas.

### `src/modules`

Bounded contexts del dominio. Cada modulo respeta Clean Architecture:

- `domain`: entidades, value objects, reglas puras y eventos de dominio.
- `application`: casos de uso, puertos, DTOs internos, servicios y autorizacion de accion.
- `infrastructure`: repositories, providers externos, storage, Supabase y adaptadores.
- `presentation`: componentes, formularios, hooks de UI y composicion visual del modulo.

Regla obligatoria:

Ningun modulo puede acceder a datos tenant-scoped sin recibir `TenantContext` desde la capa de aplicacion.

### `src/shared`

Codigo compartido entre dominios. Solo se permite aqui cuando no pertenece naturalmente a un bounded context.

### `supabase`

Activos Supabase versionados.

- `migrations`: migraciones SQL de FASE 4 y posteriores.
- `seed`: datos semilla reales y minimos para entornos controlados.
- `functions/jobs`: Edge Functions para jobs programados.
- `functions/webhooks`: Edge Functions para webhooks externos verificados.

### `tests`

Pruebas automatizadas.

- `unit`: dominio y casos de uso.
- `integration`: repositories, providers reales configurados y servicios.
- `e2e`: flujos criticos de producto.
- `security`: controles OWASP, rate limiting y autorizacion.
- `rls`: pruebas explicitas de aislamiento multi-tenant.

## 4. Modulos de dominio creados

1. `identity-tenancy`
2. `crm-leads`
3. `sales-pipeline`
4. `properties`
5. `portfolio-sharing`
6. `scheduling`
7. `communications`
8. `automation-workflows`
9. `ai`
10. `documents`
11. `marketing-ads`
12. `analytics`
13. `publishing`

## 5. Reglas de dependencias

Permitido:

- `presentation` -> `application`
- `application` -> `domain`
- `infrastructure` -> `application` y `domain`
- `src/app` -> `modules/*/presentation` o `modules/*/application`
- `modules/*` -> `shared/*` cuando sea transversal

No permitido:

- `domain` importando frameworks, Supabase, React o Next.js.
- `application` dependiendo de componentes UI.
- `presentation` consultando tablas de negocio directamente para mutaciones complejas.
- Repositories sin `TenantContext`.
- Consultas de negocio sin filtro por `tenant_id`.
- Integraciones externas en componentes UI.

## 6. Relacion con las siguientes fases

- FASE 3 usara esta estructura para documentar el modelo de datos completo.
- FASE 4 agregara migraciones SQL en `supabase/migrations`.
- FASE 5 agregara politicas RLS y pruebas en `tests/rls`.
- FASE 6 implementara backend en `src/modules/*/{domain,application,infrastructure}` y route handlers cuando corresponda.
- FASE 7 implementara frontend en `src/app`, `src/components` y `src/modules/*/presentation`.
- FASE 8 implementara integraciones reales en infrastructure, Supabase Edge Functions y webhooks.
- FASE 9 agregara CI/CD en `.github/workflows` y configuracion Vercel.
- FASE 10 completara documentacion operativa y tecnica.

## 7. Criterios de cierre de FASE 2

FASE 2 queda completa cuando:

1. Existe la estructura base de carpetas.
2. Los bounded contexts estan representados en `src/modules`.
3. Cada modulo tiene capas `domain`, `application`, `infrastructure` y `presentation`.
4. Existen carpetas para Supabase migrations, functions y seeds.
5. Existen carpetas para tests unitarios, integracion, e2e, seguridad y RLS.
6. La estructura queda documentada.
7. No se genero codigo de aplicacion.
8. No se genero SQL.
9. No se generaron mocks, funciones simuladas, placeholders ni integraciones falsas.

## 8. Estado

FASE 2 completada.

Siguiente fase permitida: FASE 3 - Generar modelo de datos completo.
