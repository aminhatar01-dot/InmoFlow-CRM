# GitHub -> Vercel -> Supabase Deployment

## Required GitHub Secrets

### Vercel

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Supabase

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
SUPABASE_DB_PASSWORD
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Application

```text
APP_BASE_URL
INTEGRATION_TOKEN_ENCRYPTION_KEY
RATE_LIMIT_WINDOW_SECONDS
RATE_LIMIT_MAX_REQUESTS
```

### Google

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
GOOGLE_ADS_DEVELOPER_TOKEN
```

### Meta / WhatsApp

```text
META_APP_ID
META_APP_SECRET
META_OAUTH_REDIRECT_URI
META_WEBHOOK_VERIFY_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```

## Workflows

### CI

File:

```text
.github/workflows/ci.yml
```

Runs on pull requests and pushes to `main`/`master`.

Steps:

- Install dependencies.
- Check formatting.
- Typecheck.
- Lint.
- Build.
- Start local Supabase.
- Apply migrations.
- Lint database.

### Vercel Production Deploy

File:

```text
.github/workflows/deploy-vercel.yml
```

Runs on pushes to `main`/`master` and manual dispatch.

Steps:

- Pull Vercel production environment.
- Build with Vercel CLI.
- Deploy prebuilt artifact to production.

### Supabase Production Deploy

File:

```text
.github/workflows/deploy-supabase.yml
```

Runs when `supabase/**` changes on `main`/`master` and manual dispatch.

Steps:

- Link Supabase project.
- Push migrations with `supabase db push`.

## Vercel Settings

File:

```text
vercel.json
```

Includes:

- Next.js framework.
- Build command.
- Install command.
- Production region.
- Security headers.

## Production Order

1. Configure Supabase project.
2. Configure Google OAuth redirect URI.
3. Configure Meta OAuth redirect URI.
4. Configure WhatsApp webhook URL.
5. Add all GitHub secrets.
6. Push migrations via `Deploy Supabase`.
7. Deploy app via `Deploy Vercel`.
8. Validate Google login.
9. Validate tenant onboarding.
10. Validate integrations page.

## Notes

`npm install` is used in workflows because no `package-lock.json` exists yet. Once npm successfully completes locally and commits `package-lock.json`, change workflow install commands back to:

```text
npm ci
```
