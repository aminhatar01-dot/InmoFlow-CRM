"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TaskCreateForm({ tenantId }: Readonly<{ tenantId: string }>): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const dueAt = optionalString(form.get("dueAt"));

    const response = await fetch(`/api/tenants/${tenantId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? ""),
        description: optionalString(form.get("description")),
        priority: Number(form.get("priority") ?? 3),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } };
      setError(payload.error?.message ?? "No se pudo crear la tarea");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="title">Titulo</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Input id="priority" name="priority" type="number" min={1} max={5} defaultValue={3} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dueAt">Vencimiento</Label>
          <Input id="dueAt" name="dueAt" type="datetime-local" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descripcion</Label>
        <Textarea id="description" name="description" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        Crear tarea
      </Button>
    </form>
  );
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}
