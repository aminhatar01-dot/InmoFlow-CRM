import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  google_oauth_not_configured:
    "Google OAuth aun no esta configurado para esta instancia. Falta cargar el Client ID y Client Secret de la app Google del producto.",
  missing_code: "Google no devolvio un codigo de autorizacion valido.",
  oauth_start_failed: "No se pudo iniciar el login con Google.",
  oauth_provider_error:
    "Google no autorizo el ingreso. Revisa la configuracion OAuth e intenta nuevamente.",
  session_exchange_failed: "No se pudo crear la sesion. Intenta ingresar nuevamente."
};

type LoginPageProps = Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function LoginPage({
  searchParams
}: LoginPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const errorParam = params?.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const errorMessage = error ? errorMessages[error] : undefined;

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
        {errorMessage ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        <Button asChild className="w-full">
          <a href="/api/auth/google/start">Continuar con Google</a>
        </Button>
      </section>
    </main>
  );
}
