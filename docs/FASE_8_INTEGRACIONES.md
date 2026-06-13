# InmoFlow CRM - FASE 8 - Integraciones

## 1. Objetivo de la fase

Implementar integraciones reales y preparadas para produccion, sin mocks ni conectores simulados.

Esta fase implementa:

- OAuth real para Google.
- OAuth real para Meta.
- Persistencia de conexiones por tenant.
- Cifrado de tokens externos.
- Webhook verification real para WhatsApp Business Platform.
- Providers HTTP para Gmail, Google Calendar, Google Ads, Meta Ads y WhatsApp.
- Pantalla de integraciones en el frontend.

## 2. Archivos principales generados

Configuracion:

- `.env.example`
- `src/config/env.ts`
- `src/lib/security/encryption.ts`

Integraciones:

- `src/modules/marketing-ads/application/integration.schemas.ts`
- `src/modules/marketing-ads/application/integration.service.ts`
- `src/modules/marketing-ads/application/integration.types.ts`
- `src/modules/marketing-ads/infrastructure/google.provider.ts`
- `src/modules/marketing-ads/infrastructure/meta.provider.ts`
- `src/modules/marketing-ads/infrastructure/oauth-state.ts`
- `src/modules/marketing-ads/infrastructure/integration.repository.ts`
- `src/modules/communications/infrastructure/whatsapp.provider.ts`

API:

- `GET /api/tenants/:tenantId/integrations`
- `GET /api/tenants/:tenantId/integrations/:provider/connect`
- `DELETE /api/tenants/:tenantId/integrations/:connectionId`
- `GET /api/integrations/google/callback`
- `GET /api/integrations/meta/callback`
- `GET /api/webhooks/whatsapp`
- `POST /api/webhooks/whatsapp`

Frontend:

- `src/app/(dashboard)/tenants/[tenantId]/integrations/page.tsx`
- `src/modules/marketing-ads/presentation/integration-disable-button.tsx`
- Navegacion de integraciones en `AppShell`.

## 3. Variables de entorno agregadas

```text
INTEGRATION_TOKEN_ENCRYPTION_KEY=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
GOOGLE_ADS_DEVELOPER_TOKEN=
META_APP_ID=
META_APP_SECRET=
META_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/meta/callback
META_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

`INTEGRATION_TOKEN_ENCRYPTION_KEY` debe tener al menos 32 caracteres.

## 4. Seguridad aplicada

### 4.1 Tokens cifrados

Los access tokens y refresh tokens se cifran con AES-256-GCM antes de guardarse en `integration_tokens`.

### 4.2 OAuth state firmado

El parametro `state` de OAuth contiene:

- `tenantId`.
- `provider`.
- `userId`.
- `nonce`.

Se firma con HMAC-SHA256 usando `INTEGRATION_TOKEN_ENCRYPTION_KEY`.

### 4.3 Tenant isolation

Cada callback valida:

1. Estado OAuth firmado.
2. Usuario autenticado actual.
3. Membresia activa del usuario en el tenant.
4. Rol Manager/Admin/Owner para conectar integraciones.

### 4.4 Service role controlado

La persistencia de tokens usa service role server-side. Los tokens no se exponen al cliente.

## 5. Integraciones implementadas

### 5.1 Gmail

Scopes:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

Provider:

- Obtiene perfil Gmail.
- Envia mensajes con `users.messages.send`.

### 5.2 Google Calendar

Scope:

- `https://www.googleapis.com/auth/calendar.events`

Provider:

- Crea eventos en el calendario primario con `events.insert`.

### 5.3 Google Ads

Scope:

- `https://www.googleapis.com/auth/adwords`

Provider:

- Lista clientes accesibles usando Google Ads API v24.
- Requiere `GOOGLE_ADS_DEVELOPER_TOKEN`.

### 5.4 Meta Ads

Scopes:

- `ads_management`
- `ads_read`
- `business_management`
- `pages_read_engagement`

Provider:

- OAuth con Graph API v25.0.
- Lista cuentas publicitarias.

### 5.5 WhatsApp

Provider:

- Verifica webhook con `hub.mode`, `hub.verify_token` y `hub.challenge`.
- Envia mensajes de texto con WhatsApp Cloud API.
- Registra webhooks entrantes en `system_logs` con metadata redaccionada.

## 6. Versiones verificadas

Se verificaron fuentes oficiales durante esta fase:

- Google Ads API: release notes oficiales indican v24 publicada el 22 de abril de 2026.
- Meta Graph API: changelog oficial indica Graph API v25.0 introducida el 18 de febrero de 2026.
- Gmail API: endpoint oficial `users.messages.send`.
- Google Calendar API: endpoint oficial `events.insert`.

## 7. Limitaciones operativas

No se puede completar una conexion real sin credenciales de proveedor:

- Google OAuth Client ID/Secret.
- Meta App ID/Secret.
- WhatsApp Phone Number ID.
- Verify token de webhook.
- Google Ads developer token.

No se generaron credenciales falsas ni respuestas simuladas.

## 8. Validacion pendiente

`npm install` sigue sin completar por timeout de npm en este entorno, por lo que quedan pendientes:

```text
npm install
npm run typecheck
npm run lint
```

Las migraciones SQL ya fueron aplicadas correctamente durante `supabase start` en FASE 7 antes de que fallara el healthcheck de Storage.

## 9. Criterios de cierre de FASE 8

FASE 8 queda completa cuando:

1. Existen providers reales para Google, Meta y WhatsApp.
2. OAuth usa endpoints reales.
3. Tokens se guardan cifrados.
4. Las conexiones se persisten por tenant.
5. Los callbacks validan state firmado y membresia.
6. WhatsApp webhook verification es real.
7. Existe pantalla de integraciones.
8. No se generaron mocks, placeholders, funciones vacias ni integraciones falsas.

## 10. Estado

FASE 8 completada con validacion npm pendiente por timeout del registro.

Siguiente fase permitida: FASE 9 - Generar despliegue automatico GitHub -> Vercel.
