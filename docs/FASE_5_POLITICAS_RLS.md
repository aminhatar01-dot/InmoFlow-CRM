# InmoFlow CRM - FASE 5 - Politicas RLS

## 1. Objetivo de la fase

Generar las politicas Row Level Security de Supabase para aplicar aislamiento multi-tenant estricto sobre el esquema creado en FASE 4.

Esta fase no implementa backend, frontend, integraciones ni tests ejecutables. La implementacion de servicios, repositories y casos de uso corresponde a FASE 6.

## 2. Archivo generado

Migracion RLS:

```text
supabase/migrations/20260613001000_rls_policies.sql
```

## 3. Principios aplicados

1. Todas las tablas publicas tienen RLS habilitado.
2. Toda tabla tenant-scoped usa politicas basadas en membresia activa.
3. Las funciones helper evitan recursividad en `tenant_memberships`.
4. Las tablas sensibles no tienen acceso directo desde clientes autenticados.
5. Storage usa paths tenant-scoped.
6. El acceso publico a portafolios se resolvera server-side con token firmado en FASE 6.
7. El service role queda reservado para backend, Edge Functions, webhooks y jobs controlados.

## 4. Helpers de autorizacion

Se crearon funciones:

- `current_user_id()`.
- `is_tenant_member(tenant_id)`.
- `has_tenant_role(tenant_id, roles)`.
- `has_tenant_permission(tenant_id, permission_key)`.
- `can_manage_tenant(tenant_id)`.
- `can_manage_team(tenant_id)`.
- `is_valid_portfolio_share_token(token_hash)`.
- `storage_tenant_id(object_name)`.

Las funciones de membresia se definen como `SECURITY DEFINER` para consultar membresias sin caer en recursividad de RLS.

## 5. Politicas por categoria

### 5.1 Identidad y tenancy

- `profiles`: cada usuario puede leer y actualizar su perfil; tambien puede leer perfiles de miembros activos de sus tenants.
- `tenants`: miembros activos pueden leer; Owner/Admin puede actualizar.
- `tenant_memberships`: usuarios pueden leer sus membresias y las de tenants donde son miembros; Owner/Admin puede gestionar.
- `tenant_invitations`: Owner/Admin/Manager puede gestionar invitaciones.
- `role_permissions`: miembros pueden leer permisos; Owner/Admin puede modificarlos.

### 5.2 CRM, pipeline, propiedades, agenda y documentos

El acceso de lectura exige membresia activa del tenant.

Las escrituras operativas se permiten a miembros activos cuando son acciones normales de CRM. Eliminaciones o configuraciones sensibles se restringen a Manager/Admin/Owner.

### 5.3 Integraciones

Las conexiones son visibles para Manager/Admin/Owner.

Los tokens cifrados en `integration_tokens` no son accesibles desde clientes autenticados. Solo service role puede operar sobre ellos.

### 5.4 IA

Todas las tablas de IA filtran por `tenant_id`.

- Knowledge documents y embeddings: escritura restringida a roles de gestion o service role.
- Conversaciones, mensajes y recomendaciones: lectura tenant-scoped.
- Logs de generacion: lectura restringida a Manager/Admin/Owner.

### 5.5 Workflows

Definiciones, versiones, triggers y ejecuciones son tenant-scoped.

La configuracion de workflows queda restringida a Manager/Admin/Owner. Las ejecuciones operativas quedan preparadas para service role/jobs.

### 5.6 Auditoria, logs y rate limiting

- `audit_logs`: lectura Owner/Admin; insercion tenant-scoped para servicios autenticados.
- `rate_limit_events`: sin acceso directo de cliente.
- `system_logs`: sin acceso directo de cliente.
- `analytics_snapshots`: lectura Manager/Admin/Owner.

### 5.7 Storage

Se crearon politicas sobre `storage.objects` para buckets previstos:

- `property-media`.
- `documents`.
- `ai-knowledge`.
- `message-attachments`.
- `tenant-assets`.

Regla de path:

```text
tenant/{tenant_id}/{resource_type}/{resource_id}/{file_name}
```

El helper `storage_tenant_id()` evita errores de casteo cuando un object path esta mal formado.

## 6. Acceso publico a portafolios

No se permite acceso anonimo directo a tablas de propiedades ni a tablas tenant-scoped.

El flujo publico correcto sera:

1. El visitante abre un enlace con token.
2. Un Route Handler o Edge Function valida el token.
3. El backend lee los datos permitidos con service role.
4. El backend registra `portfolio_view_events`.
5. Solo se devuelven propiedades incluidas en el portafolio.

Esto evita exponer politicas anonimas amplias sobre datos inmobiliarios.

## 7. Validaciones realizadas

Validaciones estaticas ejecutadas:

- 64 tablas publicas detectadas.
- 64 tablas publicas con `ENABLE ROW LEVEL SECURITY`.
- 64 tablas publicas con al menos una politica RLS.
- 4 politicas creadas para `storage.objects`.
- Sin TODOs, mocks, placeholders, simulaciones ni integraciones falsas.
- Sin reemplazos literales accidentales en foreign keys.

## 8. Validacion pendiente

No se pudo ejecutar la migracion contra PostgreSQL/Supabase local porque en este entorno no estan instalados:

- `psql`.
- Supabase CLI.

Cuando Supabase CLI este disponible, se debe ejecutar:

```text
supabase db reset
```

Luego deben agregarse tests de FASE 6/FASE 7 o una fase de QA para validar:

- Usuario de tenant A no lee tenant B.
- Usuario de tenant A no escribe tenant B.
- Agent no gestiona usuarios ni integraciones.
- Tokens de integraciones no son legibles por cliente.
- Storage rechaza paths de otro tenant.
- IA no recupera documentos ni embeddings de otro tenant.

## 9. Criterios de cierre de FASE 5

FASE 5 queda completa cuando:

1. Todas las tablas publicas tienen RLS habilitado.
2. Todas las tablas publicas tienen politicas RLS.
3. Las tablas tenant-scoped filtran por membresia activa.
4. Las tablas sensibles bloquean acceso directo de cliente.
5. Storage aplica aislamiento por tenant.
6. Los portafolios publicos no exponen tablas tenant-scoped directamente.
7. No se genero backend/frontend.
8. No se generaron mocks, placeholders, funciones vacias ni integraciones falsas.

## 10. Estado

FASE 5 completada.

Siguiente fase permitida: FASE 6 - Generar backend.
