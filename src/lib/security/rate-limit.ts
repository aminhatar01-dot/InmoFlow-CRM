import { createHash } from "node:crypto";
import { getEnv } from "@/config/env";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/shared/domain/errors";

type RateLimitInput = {
  client: AppSupabaseClient;
  scope: string;
  key: string;
  tenantId?: string;
  userId?: string;
  ip?: string;
};

export async function enforceRateLimit(input: RateLimitInput): Promise<void> {
  const env = getEnv();
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (env.RATE_LIMIT_WINDOW_SECONDS * 1000)) *
      env.RATE_LIMIT_WINDOW_SECONDS *
      1000
  );
  const windowEnd = new Date(windowStart.getTime() + env.RATE_LIMIT_WINDOW_SECONDS * 1000);
  const ipHash = input.ip ? createHash("sha256").update(input.ip).digest("hex") : null;

  const { count, error: countError } = await input.client
    .from("rate_limit_events")
    .select("*", { count: "exact", head: true })
    .eq("scope", input.scope)
    .eq("limit_key", input.key)
    .gte("created_at", windowStart.toISOString())
    .lt("created_at", windowEnd.toISOString());

  if (countError) {
    throw new AppError(500, "rate_limit_unavailable", "Rate limit check failed");
  }

  const blocked = (count ?? 0) >= env.RATE_LIMIT_MAX_REQUESTS;

  await input.client.from("rate_limit_events").insert({
    tenant_id: input.tenantId ?? null,
    user_id: input.userId ?? null,
    ip_hash: ipHash,
    scope: input.scope,
    limit_key: input.key,
    count: (count ?? 0) + 1,
    window_start: windowStart.toISOString(),
    window_end: windowEnd.toISOString(),
    blocked
  });

  if (blocked) {
    throw new AppError(429, "rate_limit_exceeded", "Too many requests");
  }
}
