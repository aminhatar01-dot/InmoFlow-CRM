import { z } from "zod";
import { ValidationError } from "@/shared/domain/errors";

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError("Request body validation failed", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseSearchParams<T extends z.ZodTypeAny>(
  url: string,
  schema: T
): z.infer<T> {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    throw new ValidationError("Query string validation failed", parsed.error.flatten());
  }

  return parsed.data;
}
