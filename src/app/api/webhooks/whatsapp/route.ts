import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { WhatsAppProvider } from "@/modules/communications/infrastructure/whatsapp.provider";
import { handleApiError, ok } from "@/shared/presentation/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const url = new URL(request.url);
    const challenge = new WhatsAppProvider().verifyWebhook(
      url.searchParams.get("hub.mode"),
      url.searchParams.get("hub.verify_token"),
      url.searchParams.get("hub.challenge")
    );

    return new NextResponse(challenge, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as {
      object?: string;
      entry?: Array<{ id?: string; changes?: unknown[] }>;
    };

    await createSupabaseServiceClient()
      .from("system_logs")
      .insert({
        tenant_id: null,
        user_id: null,
        correlation_id: null,
        module: "communications",
        operation: "whatsapp.webhook.received",
        severity: "info",
        message: "WhatsApp webhook received",
        metadata_redacted: {
          object: payload.object,
          entryCount: payload.entry?.length ?? 0
        },
        duration_ms: null
      });

    return ok({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
