"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TenantOnboardingForm(): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const slug = String(form.get("slug") ?? "");

    const response = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } };
      setError(payload.error?.message ?? "No se pudo crear la organizacion");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre de la inmobiliaria</Label>
        <Input id="name" name="name" minLength={2} maxLength={160} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Identificador</Label>
        <Input id="slug" name="slug" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" required />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        Crear organizacion
      </Button>
    </form>
  );
}
