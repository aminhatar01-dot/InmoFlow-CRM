import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEnv } from "@/config/env";

export const runtime = "edge";

export async function GET(request: NextRequest): Promise<Response> {
  const env = getEnv();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");

  if (!code) {
    const error = providerError ? "oauth_provider_error" : "missing_code";
    return NextResponse.redirect(new URL(`/login?error=${error}`, env.APP_BASE_URL));
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=session_exchange_failed", env.APP_BASE_URL));
  }

  return NextResponse.redirect(new URL("/", env.APP_BASE_URL));
}
