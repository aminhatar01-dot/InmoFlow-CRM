import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <section className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">InmoFlow CRM</h1>
            <p className="text-sm text-muted-foreground">Acceso seguro con Google</p>
          </div>
        </div>
        <Button asChild className="w-full">
          <a href="/auth/login/google">Continuar con Google</a>
        </Button>
      </section>
    </main>
  );
}
