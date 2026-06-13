import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { requireEnvValue } from "@/config/env";
import type { OAuthState } from "../application/integration.types";

export function createOAuthState(input: Omit<OAuthState, "nonce">): string {
  const payload: OAuthState = {
    ...input,
    nonce: randomBytes(16).toString("base64url")
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function parseOAuthState(state: string): OAuthState {
  const [encoded, signature] = state.split(".");

  if (!encoded || !signature) {
    throw new Error("OAuth state is malformed");
  }

  const expected = sign(encoded);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("OAuth state signature is invalid");
  }

  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthState;
}

function sign(value: string): string {
  return createHmac("sha256", requireEnvValue("INTEGRATION_TOKEN_ENCRYPTION_KEY"))
    .update(value)
    .digest("base64url");
}
