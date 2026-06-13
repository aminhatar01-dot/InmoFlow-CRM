import { ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return ok({
    status: "ok",
    service: "inmoflow-crm",
    timestamp: new Date().toISOString()
  });
}
