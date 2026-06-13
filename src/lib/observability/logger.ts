type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

type LogPayload = {
  level: LogLevel;
  message: string;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  module?: string;
  operation?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export function logEvent(payload: LogPayload): void {
  const safePayload = {
    timestamp: new Date().toISOString(),
    ...payload
  };

  const serialized = JSON.stringify(safePayload);

  if (payload.level === "error" || payload.level === "critical") {
    console.error(serialized);
    return;
  }

  if (payload.level === "warning") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}
