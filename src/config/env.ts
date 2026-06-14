import { z } from "zod";

const optionalString = (
  schema: z.ZodString
): z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown> =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const optionalUrl = optionalString(z.string().url());
const optionalNonEmptyString = optionalString(z.string().min(1));
const optionalEncryptionKey = optionalString(z.string().min(32));

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString,
  APP_BASE_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().default("http://localhost:3000")
  ),
  RATE_LIMIT_WINDOW_SECONDS: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().default(60)
  ),
  RATE_LIMIT_MAX_REQUESTS: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().default(120)
  ),
  INTEGRATION_TOKEN_ENCRYPTION_KEY: optionalEncryptionKey,
  GOOGLE_OAUTH_CLIENT_ID: optionalNonEmptyString,
  GOOGLE_OAUTH_CLIENT_SECRET: optionalNonEmptyString,
  GOOGLE_OAUTH_REDIRECT_URI: optionalUrl,
  GOOGLE_ADS_DEVELOPER_TOKEN: optionalNonEmptyString,
  META_APP_ID: optionalNonEmptyString,
  META_APP_SECRET: optionalNonEmptyString,
  META_OAUTH_REDIRECT_URI: optionalUrl,
  META_WEBHOOK_VERIFY_TOKEN: optionalNonEmptyString,
  WHATSAPP_PHONE_NUMBER_ID: optionalNonEmptyString
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export function getServiceRoleKey(): string {
  const key = getEnv().SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-side privileged operations");
  }

  return key;
}

export function requireEnvValue(key: keyof AppEnv): string {
  const value = getEnv()[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} is required`);
  }

  return value;
}
