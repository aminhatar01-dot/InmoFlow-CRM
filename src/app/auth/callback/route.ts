import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: NextRequest): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    redirect("/login?error=missing_code");
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.exchangeCodeForSession(code);

  if (error) {
    redirect("/login?error=session_exchange_failed");
  }

  redirect("/");
}
