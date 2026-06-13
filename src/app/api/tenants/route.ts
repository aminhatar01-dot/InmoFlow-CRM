import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parseJsonBody } from "@/lib/validation/request";
import { createTenantSchema } from "@/modules/identity-tenancy/application/tenant.schemas";
import { TenantService } from "@/modules/identity-tenancy/application/tenant.service";
import { created, handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}

export async function GET(request: Request): Promise<Response> {
  try {
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.tenants.list",
      key: requestIp(request) ?? "unknown",
      ip: requestIp(request)
    });

    const client = await createSupabaseServerClient();
    const service = new TenantService(client);
    return ok(await service.listCurrentUserTenants());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await enforceRateLimit({
      client: createSupabaseServiceClient(),
      scope: "api.tenants.create",
      key: requestIp(request) ?? "unknown",
      ip: requestIp(request)
    });

    const input = await parseJsonBody(request, createTenantSchema);
    const client = await createSupabaseServerClient();
    const service = new TenantService(client);
    return created(await service.createTenant(input));
  } catch (error) {
    return handleApiError(error);
  }
}
