import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Building2, ClipboardList, Home, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TenantOnboardingForm } from "@/modules/identity-tenancy/presentation/tenant-onboarding-form";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const client = await createSupabaseServerClient();
  const { data: tenants } = await client
    .from("tenants")
    .select("id,name,slug,default_currency,timezone")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const activeTenant = tenants?.[0];

  if (!activeTenant) {
    return (
      <AppShell>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Crear organizacion</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantOnboardingForm />
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const [{ count: leadsCount }, { count: propertiesCount }, { count: tasksCount }] = await Promise.all([
    client
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", activeTenant.id)
      .is("deleted_at", null),
    client
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", activeTenant.id)
      .is("deleted_at", null),
    client
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", activeTenant.id)
      .is("deleted_at", null)
  ]);

  return (
    <AppShell tenantId={activeTenant.id}>
      <PageHeader
        title={activeTenant.name}
        description={`Moneda ${activeTenant.default_currency} · ${activeTenant.timezone}`}
        action={<Badge>{activeTenant.slug}</Badge>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Leads activos" value={leadsCount ?? 0} icon={<Users className="h-4 w-4" />} />
        <MetricCard
          title="Inmuebles"
          value={propertiesCount ?? 0}
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricCard title="Tareas" value={tasksCount ?? 0} icon={<ClipboardList className="h-4 w-4" />} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <ActionCard href={`/tenants/${activeTenant.id}/leads` as Route} label="Gestionar leads" icon={<Users />} />
        <ActionCard
          href={`/tenants/${activeTenant.id}/properties` as Route}
          label="Gestionar inmuebles"
          icon={<Home />}
        />
        <ActionCard href={`/tenants/${activeTenant.id}/tasks` as Route} label="Gestionar tareas" icon={<ClipboardList />} />
      </div>
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  icon
}: Readonly<{ title: string; value: number; icon: React.ReactNode }>): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  href,
  label,
  icon
}: Readonly<{ href: Route; label: string; icon: React.ReactElement }>): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-5">
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <Button asChild variant="outline" size="icon">
          <Link href={href}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
