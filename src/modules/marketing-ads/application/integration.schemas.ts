import { z } from "zod";

export const startIntegrationSchema = z.object({
  tenantId: z.string().uuid(),
  provider: z.enum(["gmail", "google_calendar", "google_ads", "meta_ads"])
});

export const integrationCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1)
});

export const integrationListSchema = z.object({
  tenantId: z.string().uuid()
});

export const disableIntegrationSchema = z.object({
  tenantId: z.string().uuid(),
  connectionId: z.string().uuid()
});

export type StartIntegrationInput = z.infer<typeof startIntegrationSchema>;
