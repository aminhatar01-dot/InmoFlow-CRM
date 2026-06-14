import { NextResponse } from "next/server";
import { getEnv } from "@/config/env";

export async function GET(): Promise<Response> {
  const env = getEnv();

  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/login?error=google_oauth_not_configured", env.APP_BASE_URL)
    );
  }

  const authorizeUrl = new URL("/auth/v1/authorize", env.NEXT_PUBLIC_SUPABASE_URL);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", `${env.APP_BASE_URL}/auth/callback`);

  return NextResponse.redirect(authorizeUrl);
}
