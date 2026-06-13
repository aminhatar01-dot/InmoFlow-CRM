import { NextResponse } from "next/server";
import { AppError } from "@/shared/domain/errors";
import { logEvent } from "@/lib/observability/logger";

export function ok<T>(data: T, init?: ResponseInit): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T): NextResponse<{ data: T }> {
  return ok(data, { status: 201 });
}

export function empty(status = 204): NextResponse {
  return new NextResponse(null, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.status }
    );
  }

  logEvent({
    level: "error",
    message: "Unhandled API error",
    metadata: { error: error instanceof Error ? error.message : String(error) }
  });

  return NextResponse.json(
    {
      error: {
        code: "internal_server_error",
        message: "Internal server error"
      }
    },
    { status: 500 }
  );
}
