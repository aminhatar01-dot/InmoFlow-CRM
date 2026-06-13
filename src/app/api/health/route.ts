export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(): Promise<Response> {
  return Response.json({
    status: "ok",
    service: "inmoflow-crm",
    timestamp: new Date().toISOString()
  });
}
