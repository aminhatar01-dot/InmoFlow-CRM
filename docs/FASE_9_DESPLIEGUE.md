# InmoFlow CRM - FASE 9 - Despliegue Automatico GitHub -> Vercel

## 1. Objetivo de la fase

Configurar despliegue automatico productivo desde GitHub hacia Vercel, con validacion de aplicacion y migraciones Supabase.

## 2. Archivos generados

Workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-vercel.yml`
- `.github/workflows/deploy-supabase.yml`

Vercel:

- `vercel.json`

Documentacion:

- `docs/deployment/GITHUB_VERCEL_SUPABASE.md`

## 3. Pipeline implementado

### CI

Valida:

- Instalacion de dependencias.
- Formato.
- Typecheck.
- Lint.
- Build Next.js.
- Migraciones Supabase en stack local.
- Lint de base de datos.

### Deploy Vercel

Usa Vercel CLI:

- `vercel pull`.
- `vercel build --prod`.
- `vercel deploy --prebuilt --prod`.

### Deploy Supabase

Usa Supabase CLI:

- `supabase link`.
- `supabase db push`.

## 4. Seguridad

- No se versionan secretos.
- Los secretos se leen desde GitHub Actions Secrets.
- Vercel recibe variables desde su entorno productivo.
- Supabase production deploy requiere `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `SUPABASE_DB_PASSWORD`.
- `vercel.json` agrega headers de seguridad base.

## 5. npm install pendiente

Se reintento:

```text
npm install --no-audit --no-fund --ignore-scripts
npm install --no-audit --no-fund
```

Ambos comandos terminaron por timeout y no generaron:

- `node_modules`.
- `package-lock.json`.

Se detuvieron los procesos `npm install` que quedaron vivos tras el timeout.

Por este motivo no fue posible ejecutar localmente:

```text
npm run typecheck
npm run lint
```

Se ejecutaron igualmente y fallaron por dependencias no instaladas:

```text
"tsc" no se reconoce como un comando interno o externo
"eslint" no se reconoce como un comando interno o externo
```

Los workflows usan temporalmente:

```text
npm install --no-audit --no-fund
```

Cuando npm complete y se genere `package-lock.json`, se debe cambiar a:

```text
npm ci
```

## 6. Validaciones locales realizadas

- Supabase CLI disponible: `2.106.0`.
- psql disponible: `psql (PostgreSQL) 17.10`.
- No quedaron procesos `npm install` vivos.
- No quedaron contenedores Supabase de InmoFlow activos.
- Se crearon workflows de CI, Vercel y Supabase.

## 7. Criterios de cierre de FASE 9

FASE 9 queda completa cuando:

1. Existe workflow de CI.
2. Existe workflow de despliegue a Vercel.
3. Existe workflow de despliegue de Supabase.
4. Existe configuracion `vercel.json`.
5. Existen docs de secretos y orden de despliegue.
6. No se versionan secretos.
7. No se generaron mocks, placeholders, funciones vacias ni integraciones falsas.

## 8. Estado

FASE 9 completada con `npm install`, `typecheck` y `lint` pendientes por timeout del registro npm.

Siguiente fase permitida: FASE 10 - Documentacion completa.
