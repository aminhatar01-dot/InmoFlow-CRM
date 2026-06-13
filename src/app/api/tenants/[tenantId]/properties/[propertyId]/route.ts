import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/validation/request";
import { updatePropertySchema } from "@/modules/properties/application/property.schemas";
import { PropertyService } from "@/modules/properties/application/property.service";
import { handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({ tenantId: z.string().uuid(), propertyId: z.string().uuid() });

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tenantId: string; propertyId: string }> }
): Promise<Response> {
  try {
    const { tenantId, propertyId } = routeParamsSchema.parse(await context.params);
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.properties.update",
      key: `${tenantId}:${requestIp(request) ?? "unknown"}`,
      tenantId,
      ip: requestIp(request)
    });

    const input = await parseJsonBody(request, updatePropertySchema);
    const client = await createSupabaseServerClient();
    const service = new PropertyService(client);
    return ok(await service.update(tenantId, propertyId, input));
  } catch (error) {
    return handleApiError(error);
  }
}
