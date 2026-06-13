import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/request";
import {
  createPropertySchema,
  propertyFiltersSchema
} from "@/modules/properties/application/property.schemas";
import { PropertyService } from "@/modules/properties/application/property.service";
import { created, handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({ tenantId: z.string().uuid() });

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ tenantId: string }> }
): Promise<Response> {
  try {
    const { tenantId } = routeParamsSchema.parse(await context.params);
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.properties.list",
      key: `${tenantId}:${requestIp(request) ?? "unknown"}`,
      tenantId,
      ip: requestIp(request)
    });

    const query = parseSearchParams(
      request.url,
      propertyFiltersSchema.omit({ tenantId: true }).extend({ tenantId: z.string().uuid().default(tenantId) })
    );
    const client = await createSupabaseServerClient();
    const service = new PropertyService(client);
    return ok(await service.list({ ...query, tenantId }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tenantId: string }> }
): Promise<Response> {
  try {
    const { tenantId } = routeParamsSchema.parse(await context.params);
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.properties.create",
      key: `${tenantId}:${requestIp(request) ?? "unknown"}`,
      tenantId,
      ip: requestIp(request)
    });

    const input = await parseJsonBody(request, createPropertySchema.omit({ tenantId: true }));
    const client = await createSupabaseServerClient();
    const service = new PropertyService(client);
    return created(await service.create({ ...input, tenantId }));
  } catch (error) {
    return handleApiError(error);
  }
}
