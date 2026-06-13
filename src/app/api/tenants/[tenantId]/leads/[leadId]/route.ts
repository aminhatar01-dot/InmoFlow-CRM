import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/validation/request";
import { updateLeadSchema } from "@/modules/crm-leads/application/lead.schemas";
import { LeadService } from "@/modules/crm-leads/application/lead.service";
import { handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({ tenantId: z.string().uuid(), leadId: z.string().uuid() });

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tenantId: string; leadId: string }> }
): Promise<Response> {
  try {
    const { tenantId, leadId } = routeParamsSchema.parse(await context.params);
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.leads.update",
      key: `${tenantId}:${requestIp(request) ?? "unknown"}`,
      tenantId,
      ip: requestIp(request)
    });

    const input = await parseJsonBody(request, updateLeadSchema);
    const client = await createSupabaseServerClient();
    const service = new LeadService(client);
    return ok(await service.update(tenantId, leadId, input));
  } catch (error) {
    return handleApiError(error);
  }
}
