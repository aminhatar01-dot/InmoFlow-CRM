import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/validation/request";
import { updateTaskSchema } from "@/modules/scheduling/application/task.schemas";
import { TaskService } from "@/modules/scheduling/application/task.service";
import { handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({ tenantId: z.string().uuid(), taskId: z.string().uuid() });

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tenantId: string; taskId: string }> }
): Promise<Response> {
  try {
    const { tenantId, taskId } = routeParamsSchema.parse(await context.params);
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.tasks.update",
      key: `${tenantId}:${requestIp(request) ?? "unknown"}`,
      tenantId,
      ip: requestIp(request)
    });

    const input = await parseJsonBody(request, updateTaskSchema);
    const client = await createSupabaseServerClient();
    const service = new TaskService(client);
    return ok(await service.update(tenantId, taskId, input));
  } catch (error) {
    return handleApiError(error);
  }
}
