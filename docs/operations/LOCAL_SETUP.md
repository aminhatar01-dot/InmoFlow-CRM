# Local Setup

## Prerequisites

- Node.js 22+.
- Docker Desktop.
- Supabase CLI.
- PostgreSQL client `psql`.

Supabase CLI is available locally:

```text
.tools/supabase/supabase.exe
```

psql is available at:

```text
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

## Environment

Create `.env.local` from `.env.example`.

Required minimum for application boot:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=http://localhost:3000
INTEGRATION_TOKEN_ENCRYPTION_KEY=
```

## Install Dependencies

```bash
npm install
```

Current local issue:

`npm install` times out in this environment before creating `node_modules` or `package-lock.json`.

## Supabase Local

Ports were moved to `545xx` in `supabase/config.toml` to avoid conflicts with other local Supabase projects.

Start:

```bash
.tools/supabase/supabase.exe start
```

Reset database:

```bash
.tools/supabase/supabase.exe db reset
```

Known Windows issue observed:

Supabase applied migrations successfully, then Storage healthcheck failed:

```text
supabase_storage_InmoFlow_CRM container is not ready: unhealthy
```

## Next.js

After dependencies install:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```
