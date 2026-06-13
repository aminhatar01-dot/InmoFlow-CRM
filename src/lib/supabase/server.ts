import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getEnv, getServiceRoleKey } from "@/config/env";
import type { Database } from "@/shared/infrastructure/database.types";
import { createClient } from "@supabase/supabase-js";

export type AppSupabaseClient = ReturnType<typeof createClient<Database>>;

export async function createSupabaseServerClient(): Promise<AppSupabaseClient> {
  const env = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          for (const cookieToSet of cookiesToSet) {
            try {
              cookieStore.set(cookieToSet.name, cookieToSet.value, cookieToSet.options);
            } catch {
              // Server Components cannot set cookies; Route Handlers handle session mutation.
            }
          }
        }
      }
    }
  ) as unknown as AppSupabaseClient;
}

export function createSupabaseServiceClient(): AppSupabaseClient {
  const env = getEnv();

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
