import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { IntegrationService } from "@/modules/marketing-ads/application/integration.service";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({
  tenantId: z.string().uuid(),
  provider: z.enum(["gmail", "google_calendar", "google_ads", "meta_ads"])
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ tenantId: string; provider: string }> }
): Promise<Response> {
  const params = routeParamsSchema.parse(await context.params);
  const userClient = await createSupabaseServerClient();
  const service = new IntegrationService(userClient, createSupabaseServiceClient());
  const url = await service.createAuthorizationUrl(params);
  return NextResponse.redirect(url);
}
