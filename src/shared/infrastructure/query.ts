import { AppError } from "@/shared/domain/errors";

export function unwrapSupabase<T>(data: T | null, error: { message: string } | null): T {
  if (error) {
    throw new AppError(500, "database_error", error.message);
  }

  if (data === null) {
    throw new AppError(404, "not_found", "Requested record was not found");
  }

  return data;
}

export function unwrapSupabaseList<T>(data: T[] | null, error: { message: string } | null): T[] {
  if (error) {
    throw new AppError(500, "database_error", error.message);
  }

  return data ?? [];
}
