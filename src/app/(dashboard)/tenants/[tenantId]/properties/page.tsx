import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertyCreateForm } from "@/modules/properties/presentation/property-create-form";

const paramsSchema = z.object({ tenantId: z.string().uuid() });

export default async function PropertiesPage({
  params
}: Readonly<{ params: Promise<{ tenantId: string }> }>): Promise<React.ReactElement> {
  const { tenantId } = paramsSchema.parse(await params);
  const client = await createSupabaseServerClient();
  const { data: properties } = await client
    .from("properties")
    .select("id,code,title,property_type,operation_type,status,featured,created_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell tenantId={tenantId}>
      <PageHeader title="Inmuebles" description="Portafolio comercial y fichas operativas" />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Operacion</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(properties ?? []).map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-mono text-xs">{property.code}</TableCell>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell>{property.operation_type}</TableCell>
                    <TableCell>
                      <Badge>{property.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo inmueble</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyCreateForm tenantId={tenantId} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
