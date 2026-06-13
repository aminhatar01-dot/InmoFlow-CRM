# InmoFlow CRM Production Launch Handoff

Estado verificado el 2026-06-13.

## Estado actual

- Rama local: `main`
- Vercel project: `inmoflow-crm`
- Vercel project ID: `prj_QG4DLdPMfxyCgbAij39SIiE6cv4a`
- Vercel team/org ID: `team_EoRq9XvrOxaRNxVkIEBsKKsI`
- Produccion publica: <https://inmoflow-crm-nine.vercel.app>
- Health check publico: <https://inmoflow-crm-nine.vercel.app/api/health>
- Vercel Authentication: desactivado (`ssoProtection: null`)
- Validaciones locales verdes:
  - `npm run format:check`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`

## Pendiente con intervencion del owner

### 1. Autenticar GitHub CLI

Abrir PowerShell en el repo y ejecutar:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' auth login
& 'C:\Program Files\GitHub CLI\gh.exe' auth setup-git
& 'C:\Program Files\GitHub CLI\gh.exe' auth status
```

Usar flujo web con la cuenta `aminhatar01-dot`.

Documentacion: <https://cli.github.com/manual/gh_auth_login>

### 2. Crear repo GitHub y subir el proyecto

GitHub no acepta espacios en el nombre tecnico del repositorio. Usar `InmoFlow-CRM` como slug y `InmoFlow CRM` como nombre visible/descriptivo.

Opcion CLI, despues del login:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' repo create InmoFlow-CRM --private --source . --remote origin --push
```

Opcion web directa:

- Crear repo: <https://github.com/new?name=InmoFlow-CRM>
- Owner sugerido: `aminhatar01-dot`
- Visibilidad sugerida: `Private`
- No inicializar con README, .gitignore ni licencia porque el repo local ya existe.

Despues de crear por web:

```powershell
git remote add origin https://github.com/aminhatar01-dot/InmoFlow-CRM.git
git push -u origin main
```

Documentacion: <https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository>

### 3. Crear proyecto Supabase

La CLI local pudo listar proyectos, pero fallo al crear proyecto remoto con `Transport error (POST https://api.supabase.com/v1/projects)`. Crear desde Dashboard:

- Nuevo proyecto Supabase: <https://supabase.com/dashboard/new>
- Nombre: `InmoFlow CRM`
- Region recomendada: `South America (Sao Paulo)` si esta disponible; si no, `US East`.
- Guardar la database password en un gestor seguro.

Cuando el proyecto exista, copiar:

- Project ref
- Project URL
- anon key
- service role key

Dashboard de providers Auth:

```text
https://supabase.com/dashboard/project/<PROJECT_REF>/auth/providers
```

Documentacion: <https://supabase.com/docs/guides/getting-started>

### 4. Aplicar migraciones Supabase

Despues de crear el proyecto y tener la password:

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
.tools\supabase\supabase.exe link --project-ref '<PROJECT_REF>' --password '<DB_PASSWORD>'
.tools\supabase\supabase.exe db push --linked --password '<DB_PASSWORD>'
```

Documentacion: <https://supabase.com/docs/guides/deployment/database-migrations>

### 5. Configurar Google OAuth en Supabase

En Google Cloud Console:

- Crear OAuth Client ID tipo Web.
- Authorized redirect URI de Supabase:

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

Luego pegar Client ID y Client Secret en Supabase Auth > Providers > Google.

Links:

- Google credentials: <https://console.cloud.google.com/apis/credentials>
- Supabase Google Auth: <https://supabase.com/docs/guides/auth/social-login/auth-google>

### 6. Configurar variables en Vercel

Panel directo del proyecto:

<https://vercel.com/aminhatar01-8073s-projects/inmoflow-crm/settings/environment-variables>

Configurar en Production, Preview y Development segun corresponda:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
APP_BASE_URL=https://inmoflow-crm-nine.vercel.app
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=120
INTEGRATION_TOKEN_ENCRYPTION_KEY=<32_BYTE_SECRET>
GOOGLE_OAUTH_CLIENT_ID=<GOOGLE_CLIENT_ID>
GOOGLE_OAUTH_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>
GOOGLE_OAUTH_REDIRECT_URI=https://inmoflow-crm-nine.vercel.app/api/integrations/google/callback
GOOGLE_ADS_DEVELOPER_TOKEN=<GOOGLE_ADS_DEVELOPER_TOKEN>
META_APP_ID=<META_APP_ID>
META_APP_SECRET=<META_APP_SECRET>
META_OAUTH_REDIRECT_URI=https://inmoflow-crm-nine.vercel.app/api/integrations/meta/callback
META_WEBHOOK_VERIFY_TOKEN=<META_WEBHOOK_VERIFY_TOKEN>
WHATSAPP_PHONE_NUMBER_ID=<WHATSAPP_PHONE_NUMBER_ID>
```

Generar `INTEGRATION_TOKEN_ENCRYPTION_KEY`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Documentacion:

- Vercel env vars: <https://vercel.com/docs/environment-variables>
- Vercel env CLI: <https://vercel.com/docs/cli/env>

### 7. Configurar secrets de GitHub Actions

Cuando exista el repo:

```text
https://github.com/aminhatar01-dot/InmoFlow-CRM/settings/secrets/actions
```

Secrets requeridos por workflows:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_BASE_URL
INTEGRATION_TOKEN_ENCRYPTION_KEY
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
GOOGLE_ADS_DEVELOPER_TOKEN
META_APP_ID
META_APP_SECRET
META_OAUTH_REDIRECT_URI
META_WEBHOOK_VERIFY_TOKEN
WHATSAPP_PHONE_NUMBER_ID
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_REF
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Valores conocidos:

```text
VERCEL_ORG_ID=team_EoRq9XvrOxaRNxVkIEBsKKsI
VERCEL_PROJECT_ID=prj_QG4DLdPMfxyCgbAij39SIiE6cv4a
APP_BASE_URL=https://inmoflow-crm-nine.vercel.app
```

Documentacion: <https://docs.github.com/actions/security-guides/using-secrets-in-github-actions>

### 8. Conectar GitHub con Vercel

Cuando el repo este subido, conectar el proyecto Vercel existente a GitHub:

<https://vercel.com/aminhatar01-8073s-projects/inmoflow-crm/settings/git>

Seleccionar `aminhatar01-dot/InmoFlow-CRM` y dejar `main` como production branch.

Documentacion: <https://vercel.com/docs/git/vercel-for-github>

## Verificacion final esperada

```powershell
npm run format:check
npm run typecheck
npm run lint
npm run build
curl.exe --ssl-no-revoke -sS https://inmoflow-crm-nine.vercel.app/api/health
```

El health check debe responder:

```json
{ "status": "ok", "service": "inmoflow-crm", "timestamp": "..." }
```
