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

type RateLimitBucket = {
  count: number;
  windowEnd: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export async function enforceRateLimit(input: RateLimitInput): Promise<void> {
  const env = getEnv();
  const now = new Date();
  const windowMs = env.RATE_LIMIT_WINDOW_SECONDS * 1000;
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowEnd = windowStart + windowMs;
  const hashedKey = createHash("sha256")
    .update([input.scope, input.key, input.tenantId, input.userId, input.ip].join(":"))
    .digest("hex");
  const bucket = rateLimitBuckets.get(hashedKey);

  for (const [key, value] of rateLimitBuckets.entries()) {
    if (value.windowEnd <= now.getTime()) {
      rateLimitBuckets.delete(key);
    }
  }

  const nextBucket =
    bucket && bucket.windowEnd > now.getTime()
      ? { count: bucket.count + 1, windowEnd: bucket.windowEnd }
      : { count: 1, windowEnd };

  rateLimitBuckets.set(hashedKey, nextBucket);

  if (nextBucket.count > env.RATE_LIMIT_MAX_REQUESTS) {
    throw new AppError(429, "rate_limit_exceeded", "Too many requests");
  }

  void input.client;
  void windowStart;
}
