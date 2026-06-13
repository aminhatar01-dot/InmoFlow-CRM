import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { IntegrationService } from "@/modules/marketing-ads/application/integration.service";
import { parseOAuthState } from "@/modules/marketing-ads/infrastructure/oauth-state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    redirect("/?integration_error=meta_missing_callback_params");
  }

  const parsedState = parseOAuthState(state);
  const userClient = await createSupabaseServerClient();
  const service = new IntegrationService(userClient, createSupabaseServiceClient());
  await service.completeMetaCallback(code, state);
  redirect(`/tenants/${parsedState.tenantId}/integrations?connected=meta`);
}
