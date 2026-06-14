import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: NextRequest): Promise<Response> {
  const env = getEnv();
  const origin = request.nextUrl.origin;

  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/login?error=google_oauth_not_configured", origin));
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=oauth_start_failed", origin));
  }

  return NextResponse.redirect(data.url);
}
