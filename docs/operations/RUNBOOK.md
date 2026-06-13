# Operations Runbook

## Check Local Tooling

```powershell
.tools\supabase\supabase.exe --version
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version
docker --version
node --version
npm --version
```

## Start Supabase

```powershell
.tools\supabase\supabase.exe start
```

If ports conflict, inspect:

```powershell
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

## Stop Supabase

```powershell
.tools\supabase\supabase.exe stop
```

## Apply Migrations Locally

```powershell
.tools\supabase\supabase.exe db reset
```

## Deploy Supabase

Use GitHub Actions workflow:

```text
Deploy Supabase
```

## Deploy Vercel

Use GitHub Actions workflow:

```text
Deploy Vercel
```

## npm Timeout Recovery

If `npm install` hangs:

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*npm-cli.js*install*' } |
  Select-Object ProcessId,Name,CommandLine
```

Stop stale install:

```powershell
Stop-Process -Id <pid> -Force
```

## Production Smoke Test

1. Open app.
2. Login with Google.
3. Create tenant.
4. Create lead.
5. Create property.
6. Create task.
7. Open Integrations.
8. Start Google OAuth.
9. Verify audit logs in Supabase.
