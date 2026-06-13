"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function IntegrationDisableButton({
  tenantId,
  connectionId
}: Readonly<{ tenantId: string; connectionId: string }>): React.ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disable(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/tenants/${tenantId}/integrations/${connectionId}`, {
      method: "DELETE"
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } };
      setError(payload.error?.message ?? "No se pudo desactivar la integracion");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-1">
      <Button type="button" variant="outline" size="sm" onClick={disable} disabled={isSubmitting}>
        Desactivar
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
