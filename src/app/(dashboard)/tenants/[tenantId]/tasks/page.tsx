import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TaskCreateForm } from "@/modules/scheduling/presentation/task-create-form";

const paramsSchema = z.object({ tenantId: z.string().uuid() });

export default async function TasksPage({
  params
}: Readonly<{ params: Promise<{ tenantId: string }> }>): Promise<React.ReactElement> {
  const { tenantId } = paramsSchema.parse(await params);
  const client = await createSupabaseServerClient();
  const { data: tasks } = await client
    .from("tasks")
    .select("id,title,description,status,priority,due_at,created_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(100);

  return (
    <AppShell tenantId={tenantId}>
      <PageHeader title="Tareas" description="Seguimientos, recordatorios operativos y pendientes" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Agenda de trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Vence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks ?? []).map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.description ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <Badge>{task.status}</Badge>
                    </TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.due_at ? new Date(task.due_at).toLocaleString("es-AR") : "Sin fecha"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nueva tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskCreateForm tenantId={tenantId} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
