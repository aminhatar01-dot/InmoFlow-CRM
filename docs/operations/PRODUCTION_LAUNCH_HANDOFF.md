# InmoFlow CRM Production Launch Handoff

Estado verificado el 2026-06-13.

## Produccion

- GitHub repo: <https://github.com/aminhatar01-dot/InmoFlow-CRM>
- Rama productiva: `main`
- Vercel project: `inmoflow-crm`
- Vercel project ID: `prj_QG4DLdPMfxyCgbAij39SIiE6cv4a`
- Vercel team/org ID: `team_EoRq9XvrOxaRNxVkIEBsKKsI`
- Produccion publica: <https://inmoflow-crm-nine.vercel.app>
- Health check publico: <https://inmoflow-crm-nine.vercel.app/api/health>
- Vercel Authentication: desactivado (`ssoProtection: null`)
- Supabase project: `InmoFlow CRM`
- Supabase project ref: `lsijhmucmhwlnojlwany`
- Supabase project URL: <https://lsijhmucmhwlnojlwany.supabase.co>
- Supabase dashboard: <https://supabase.com/dashboard/project/lsijhmucmhwlnojlwany>

## Verificaciones ejecutadas

- `npm install` ejecutado usando workaround local por TLS corporativo (`strict-ssl=false`) y `.npmrc` removido despues.
- `npm run format:check`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Supabase remote health:
  - `db`: `ACTIVE_HEALTHY`
  - `auth`: `ACTIVE_HEALTHY`
  - `rest`: `ACTIVE_HEALTHY`
  - `realtime`: `ACTIVE_HEALTHY`
  - `storage`: `ACTIVE_HEALTHY`
- Migraciones remotas aplicadas:
  - `20260613000000_initial_schema.sql`
  - `20260613001000_rls_policies.sql`
- RLS remoto verificado: `64/64` tablas publicas con Row Level Security habilitado.
- `supabase db lint --schema public --level error` remoto: sin errores.

## Variables configuradas

### Vercel Production

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `INTEGRATION_TOKEN_ENCRYPTION_KEY`

Panel directo:

<https://vercel.com/aminhatar01-8073s-projects/inmoflow-crm/settings/environment-variables>

### GitHub Actions secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `INTEGRATION_TOKEN_ENCRYPTION_KEY`

Panel directo:

<https://github.com/aminhatar01-dot/InmoFlow-CRM/settings/secrets/actions>

## Workflows

- CI: valida formato, typecheck, lint, build y migraciones Supabase locales.
- Deploy Vercel: despliega `main` a Vercel usando los secrets del repo.
- Deploy Supabase: enlaza el proyecto remoto y aplica migraciones con password no interactiva.

Acciones:

<https://github.com/aminhatar01-dot/InmoFlow-CRM/actions>

## Pendiente con credenciales externas del owner

Estas tareas no se pueden completar sin credenciales reales de proveedor. No se deben crear placeholders ni integraciones falsas.

### Google OAuth para Supabase Auth

- Google credentials: <https://console.cloud.google.com/apis/credentials>
- Supabase Google provider: <https://supabase.com/dashboard/project/lsijhmucmhwlnojlwany/auth/providers>
- Authorized redirect URI:

```text
https://lsijhmucmhwlnojlwany.supabase.co/auth/v1/callback
```

### Google APIs de la app

Configurar en GitHub/Vercel cuando existan:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI=https://inmoflow-crm-nine.vercel.app/api/integrations/google/callback
GOOGLE_ADS_DEVELOPER_TOKEN
```

Google Cloud Console:

<https://console.cloud.google.com/apis/credentials>

### Meta Ads y WhatsApp Cloud API

Configurar en GitHub/Vercel cuando existan:

```text
META_APP_ID
META_APP_SECRET
META_OAUTH_REDIRECT_URI=https://inmoflow-crm-nine.vercel.app/api/integrations/meta/callback
META_WEBHOOK_VERIFY_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```

Meta developers:

<https://developers.facebook.com/apps/>

## Verificacion final manual

```powershell
curl.exe --ssl-no-revoke -sS https://inmoflow-crm-nine.vercel.app/api/health
```

Respuesta esperada:

```json
{ "status": "ok", "service": "inmoflow-crm", "timestamp": "..." }
```
