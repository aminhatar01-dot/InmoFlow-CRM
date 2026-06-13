import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const client = await createSupabaseServerClient();
  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
