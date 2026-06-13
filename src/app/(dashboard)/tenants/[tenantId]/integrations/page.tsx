import Link from "next/link";
import { z } from "zod";
import { CalendarDays, Mail, Megaphone, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IntegrationDisableButton } from "@/modules/marketing-ads/presentation/integration-disable-button";
import type { IntegrationProvider } from "@/shared/infrastructure/database.types";

const paramsSchema = z.object({ tenantId: z.string().uuid() });

const availableIntegrations: Array<{
  provider: "gmail" | "google_calendar" | "google_ads" | "meta_ads";
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    provider: "gmail",
    title: "Gmail",
    description: "Lectura y envio controlado de correos asociados a leads.",
    icon: <Mail className="h-4 w-4" />
  },
  {
    provider: "google_calendar",
    title: "Google Calendar",
    description: "Sincronizacion de visitas, eventos y agenda comercial.",
    icon: <CalendarDays className="h-4 w-4" />
  },
  {
    provider: "google_ads",
    title: "Google Ads",
    description: "Importacion de leads, campañas y atribucion comercial.",
    icon: <Megaphone className="h-4 w-4" />
  },
  {
    provider: "meta_ads",
    title: "Meta Ads",
    description: "Conexion con cuentas publicitarias y leads de formularios.",
    icon: <MessageCircle className="h-4 w-4" />
  }
];

export default async function IntegrationsPage({
  params
}: Readonly<{ params: Promise<{ tenantId: string }> }>): Promise<React.ReactElement> {
  const { tenantId } = paramsSchema.parse(await params);
  const client = await createSupabaseServerClient();
  const { data: connections } = await client
    .from("integration_connections")
    .select("id,provider,display_name,status,scopes,connected_at,last_error")
    .eq("tenant_id", tenantId)
    .order("connected_at", { ascending: false });

  return (
    <AppShell tenantId={tenantId}>
      <PageHeader
        title="Integraciones"
        description="Conecta proveedores reales mediante OAuth y webhooks verificados"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {availableIntegrations.map((integration) => (
          <Card key={integration.provider}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {integration.icon}
                {integration.title}
              </CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link
                  href={`/api/tenants/${tenantId}/integrations/${integration.provider}/connect`}
                >
                  Conectar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Conexiones activas</CardTitle>
          <CardDescription>Tokens cifrados en backend, nunca expuestos al cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(connections ?? []).map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell>{providerLabel(connection.provider as IntegrationProvider)}</TableCell>
                  <TableCell className="font-medium">{connection.display_name}</TableCell>
                  <TableCell>
                    <Badge>{connection.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-sm truncate text-xs text-muted-foreground">
                    {(connection.scopes ?? []).join(", ")}
                  </TableCell>
                  <TableCell>
                    <IntegrationDisableButton tenantId={tenantId} connectionId={connection.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function providerLabel(provider: IntegrationProvider): string {
  const labels: Record<IntegrationProvider, string> = {
    whatsapp: "WhatsApp",
    gmail: "Gmail",
    google_calendar: "Google Calendar",
    google_ads: "Google Ads",
    meta_ads: "Meta Ads",
    zonaprop: "Zonaprop",
    argenprop: "Argenprop",
    mercado_libre: "Mercado Libre"
  };

  return labels[provider];
}
