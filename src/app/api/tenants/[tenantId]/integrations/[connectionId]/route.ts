import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { IntegrationService } from "@/modules/marketing-ads/application/integration.service";
import { handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({
  tenantId: z.string().uuid(),
  connectionId: z.string().uuid()
});

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ tenantId: string; connectionId: string }> }
): Promise<Response> {
  try {
    const { tenantId, connectionId } = routeParamsSchema.parse(await context.params);
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.integrations.disable",
      key: `${tenantId}:${requestIp(request) ?? "unknown"}`,
      tenantId,
      ip: requestIp(request)
    });

    const userClient = await createSupabaseServerClient();
    const service = new IntegrationService(userClient, createSupabaseServiceClient());
    return ok(await service.disable(tenantId, connectionId));
  } catch (error) {
    return handleApiError(error);
  }
}
