import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadCreateForm } from "@/modules/crm-leads/presentation/lead-create-form";

const paramsSchema = z.object({ tenantId: z.string().uuid() });

export default async function LeadsPage({
  params
}: Readonly<{ params: Promise<{ tenantId: string }> }>): Promise<React.ReactElement> {
  const { tenantId } = paramsSchema.parse(await params);
  const client = await createSupabaseServerClient();
  const { data: leads } = await client
    .from("leads")
    .select("id,display_name,email,phone,status,operation_type,score,next_follow_up_at,created_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell tenantId={tenantId}>
      <PageHeader title="Leads" description="Seguimiento comercial y oportunidades entrantes" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Leads activos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Operacion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leads ?? []).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.display_name}</TableCell>
                    <TableCell>
                      <div>{lead.email ?? "Sin email"}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone ?? "Sin telefono"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge>{lead.status}</Badge>
                    </TableCell>
                    <TableCell>{lead.score}</TableCell>
                    <TableCell>{lead.operation_type ?? "Sin definir"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadCreateForm tenantId={tenantId} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
