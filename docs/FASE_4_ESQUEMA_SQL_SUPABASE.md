# InmoFlow CRM - FASE 4 - Esquema SQL de Supabase

## 1. Objetivo de la fase

Generar el esquema SQL inicial de Supabase a partir del modelo de datos completo definido en FASE 3.

La migracion creada incluye:

- Extensiones necesarias.
- Tipos enum.
- Funcion comun de `updated_at`.
- Tablas principales.
- Claves primarias.
- Foreign keys.
- Constraints.
- Indices.
- Indices vectoriales para IA tenant-scoped.
- Triggers de actualizacion de `updated_at`.

Las politicas RLS no se implementan en esta fase. Corresponden a FASE 5.

## 2. Archivo generado

Migracion inicial:

```text
supabase/migrations/20260613000000_initial_schema.sql
```

## 3. Decisiones tecnicas aplicadas

### 3.1 UUID como identificador principal

Todas las entidades principales usan UUID con `gen_random_uuid()`.

### 3.2 Foreign keys compuestas para tenant isolation

Las relaciones entre tablas tenant-scoped usan foreign keys compuestas con `tenant_id` e `id`.

Esto evita que una fila de un tenant pueda referenciar una entidad de otro tenant incluso si una futura capa de aplicacion comete un error.

### 3.3 `unique (tenant_id, id)` en tablas tenant-scoped

Cada tabla tenant-scoped incluye `unique (tenant_id, id)` para soportar foreign keys compuestas y reforzar el modelo de aislamiento.

### 3.4 Soft delete en entidades operativas

Se agrego `deleted_at` en entidades donde la recuperacion, auditoria o continuidad operativa es relevante:

- Tenants.
- Leads.
- Propiedades.
- Oportunidades.
- Tareas.
- Portafolios.
- Workflows.
- Plantillas.
- Documentos.

### 3.5 Append-only en historiales y auditoria

No se agregan triggers de `updated_at` a tablas append-only como:

- `lead_assignments`.
- `lead_activities`.
- `lead_scores`.
- `opportunity_stage_history`.
- `domain_events`.
- `audit_logs`.
- `ai_generation_logs`.

### 3.6 IA tenant-scoped

Las tablas de IA incluyen `tenant_id`, y `ai_embeddings` define un indice vectorial `ivfflat` sobre `embedding`.

El filtrado obligatorio por tenant y las politicas RLS se agregaran en FASE 5.

### 3.7 Integraciones reales

El esquema incluye tablas para conexiones, tokens cifrados, sync state, canales, ads y portales.

No se generaron integraciones simuladas ni datos falsos.

## 4. Cobertura del esquema

La migracion contiene 64 tablas:

- Identidad y tenancy.
- CRM de leads.
- Pipeline comercial.
- Inmuebles.
- Portafolios compartibles.
- Agenda, calendario, tareas y recordatorios.
- Comunicaciones.
- Automatizaciones y workflows.
- IA.
- Documentos.
- Marketing y ads.
- Publicacion en portales.
- Auditoria, logs, rate limiting y analytics.

## 5. Validaciones realizadas

Validaciones estaticas ejecutadas localmente:

- Se confirmo que existen 64 tablas.
- Se confirmo que las 60 tablas tenant-scoped tienen `tenant_id`.
- Se confirmo que las 60 tablas tenant-scoped tienen `unique (tenant_id, id)`.
- Se confirmo que no quedan foreign keys compuestas con `ON DELETE SET NULL`.
- Se confirmo que no existen menciones a TODOs, mocks, placeholders, simulaciones o integraciones falsas.

## 6. Validacion pendiente

No se pudo ejecutar la migracion contra PostgreSQL local porque en este entorno no estan instalados:

- `psql`.
- Supabase CLI.

La primera accion tecnica de FASE 5 o de una fase de setup local debe ser instalar/usar Supabase CLI o conectar una base Supabase real para ejecutar:

```text
supabase db reset
```

o aplicar la migracion en un entorno Supabase controlado.

## 7. Criterios de cierre de FASE 4

FASE 4 queda completa cuando:

1. Existe una migracion SQL inicial.
2. El esquema cubre todas las entidades de FASE 3.
3. Todas las tablas tenant-scoped contienen `tenant_id`.
4. Las relaciones tenant-scoped usan foreign keys compuestas.
5. Existen constraints e indices base.
6. Existen tablas para auditoria, logs y rate limiting.
7. Existen tablas para IA tenant-scoped.
8. Existen tablas para integraciones reales.
9. No se generaron politicas RLS.
10. No se genero backend/frontend.
11. No se generaron mocks, placeholders, funciones vacias ni integraciones falsas.

## 8. Estado

FASE 4 completada.

Siguiente fase permitida: FASE 5 - Generar politicas RLS.
