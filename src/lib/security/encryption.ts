import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { requireEnvValue } from "@/config/env";

const algorithm = "aes-256-gcm";

function encryptionKey(): Buffer {
  return createHash("sha256").update(requireEnvValue("INTEGRATION_TOKEN_ENCRYPTION_KEY")).digest();
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export function decryptSecret(value: string): string {
  const [ivValue, authTagValue, encryptedValue] = value.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Encrypted secret payload is invalid");
  }

  const decipher = createDecipheriv(algorithm, encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
