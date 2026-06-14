import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "edge";

export async function GET(request: NextRequest): Promise<Response> {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");

  if (!code) {
    const error = providerError ? "oauth_provider_error" : "missing_code";
    return NextResponse.redirect(new URL(`/login?error=${error}`, origin));
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.exchangeCodeForSession(code);

  if (error) {
    logEvent({
      level: "error",
      module: "auth",
      operation: "exchange_google_code",
      message: "Supabase session exchange failed",
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        errorStatus: "status" in error ? error.status : undefined,
        errorCode: "code" in error ? error.code : undefined,
        hasCode: Boolean(code),
        hasCodeVerifierCookie: request.cookies
          .getAll()
          .some((cookie) => cookie.name.endsWith("auth-token-code-verifier"))
      }
    });

    return NextResponse.redirect(new URL("/login?error=session_exchange_failed", origin));
  }

  return NextResponse.redirect(new URL("/", origin));
}
