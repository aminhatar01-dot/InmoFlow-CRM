"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function LeadCreateForm({ tenantId }: Readonly<{ tenantId: string }>): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    const response = await fetch(`/api/tenants/${tenantId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(form.get("displayName") ?? ""),
        email: optionalString(form.get("email")),
        phone: optionalString(form.get("phone")),
        operationType: optionalString(form.get("operationType")),
        notes: optionalString(form.get("notes")),
        preferredLocations: []
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } };
      setError(payload.error?.message ?? "No se pudo crear el lead");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="displayName">Nombre</Label>
        <Input id="displayName" name="displayName" required />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="operationType">Operacion</Label>
        <select
          id="operationType"
          name="operationType"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="">Sin definir</option>
          <option value="sale">Venta</option>
          <option value="rent">Alquiler</option>
          <option value="temporary_rent">Temporal</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        Crear lead
      </Button>
    </form>
  );
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}
