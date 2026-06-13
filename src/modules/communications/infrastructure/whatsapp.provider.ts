import { requireEnvValue } from "@/config/env";
import { AppError } from "@/shared/domain/errors";

const graphApiBaseUrl = "https://graph.facebook.com/v25.0";

export class WhatsAppProvider {
  verifyWebhook(mode: string | null, token: string | null, challenge: string | null): string {
    if (
      mode !== "subscribe" ||
      !challenge ||
      token !== requireEnvValue("META_WEBHOOK_VERIFY_TOKEN")
    ) {
      throw new AppError(
        403,
        "whatsapp_webhook_verification_failed",
        "Webhook verification failed"
      );
    }

    return challenge;
  }

  async sendTextMessage(input: {
    accessToken: string;
    to: string;
    body: string;
    phoneNumberId?: string;
  }): Promise<{ messageId: string }> {
    const phoneNumberId = input.phoneNumberId ?? requireEnvValue("WHATSAPP_PHONE_NUMBER_ID");
    const response = await fetch(`${graphApiBaseUrl}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "text",
        text: { body: input.body }
      })
    });

    if (!response.ok) {
      throw new AppError(502, "whatsapp_send_failed", await response.text());
    }

    const payload = (await response.json()) as { messages?: Array<{ id: string }> };
    const messageId = payload.messages?.[0]?.id;

    if (!messageId) {
      throw new AppError(
        502,
        "whatsapp_send_failed",
        "WhatsApp response did not include message id"
      );
    }

    return { messageId };
  }
}
