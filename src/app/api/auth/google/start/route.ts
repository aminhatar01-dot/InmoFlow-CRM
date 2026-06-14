import { NextResponse } from "next/server";
import { getEnv } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(): Promise<Response> {
  const env = getEnv();

  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/login?error=google_oauth_not_configured", env.APP_BASE_URL)
    );
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.APP_BASE_URL}/auth/callback`
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=oauth_start_failed", env.APP_BASE_URL));
  }

  return NextResponse.redirect(data.url);
}
