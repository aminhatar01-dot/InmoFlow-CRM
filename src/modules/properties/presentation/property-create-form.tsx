"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PropertyCreateForm({ tenantId }: Readonly<{ tenantId: string }>): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    const response = await fetch(`/api/tenants/${tenantId}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: String(form.get("code") ?? ""),
        title: String(form.get("title") ?? ""),
        description: optionalString(form.get("description")),
        propertyType: String(form.get("propertyType") ?? ""),
        operationType: String(form.get("operationType") ?? "sale"),
        status: "draft",
        featured: false
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } };
      setError(payload.error?.message ?? "No se pudo crear el inmueble");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="code">Codigo</Label>
          <Input id="code" name="code" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="propertyType">Tipo</Label>
          <Input id="propertyType" name="propertyType" required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="title">Titulo</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="operationType">Operacion</Label>
        <select id="operationType" name="operationType" className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="sale">Venta</option>
          <option value="rent">Alquiler</option>
          <option value="temporary_rent">Temporal</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descripcion</Label>
        <Textarea id="description" name="description" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        Crear inmueble
      </Button>
    </form>
  );
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}
