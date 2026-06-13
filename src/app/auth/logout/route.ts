import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(): Promise<Response> {
  const client = await createSupabaseServerClient();
  await client.auth.signOut();
  redirect("/login");
}
