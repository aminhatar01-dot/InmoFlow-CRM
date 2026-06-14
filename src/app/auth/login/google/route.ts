import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEnv } from "@/config/env";

export async function GET(): Promise<Response> {
  const env = getEnv();

  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    redirect("/login?error=google_oauth_not_configured");
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.APP_BASE_URL}/auth/callback`
    }
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_start_failed");
  }

  return NextResponse.redirect(data.url);
}
