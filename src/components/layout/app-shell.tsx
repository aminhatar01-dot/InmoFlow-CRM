import Link from "next/link";
import type { Route } from "next";
import { Building2, ClipboardList, Home, LogOut, Plug, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppShell({
  children,
  tenantId
}: Readonly<{ children: React.ReactNode; tenantId?: string }>): React.ReactElement {
  const navItems: NavItem[] = tenantId
    ? [
        { href: "/", label: "Panel", icon: Home },
        { href: `/tenants/${tenantId}/leads` as Route, label: "Leads", icon: Users },
        { href: `/tenants/${tenantId}/properties` as Route, label: "Inmuebles", icon: Building2 },
        { href: `/tenants/${tenantId}/tasks` as Route, label: "Tareas", icon: ClipboardList },
        { href: `/tenants/${tenantId}/integrations` as Route, label: "Integraciones", icon: Plug }
      ]
    : [{ href: "/", label: "Panel", icon: Home }];

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            InmoFlow
          </Link>
          <form action="/auth/logout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border bg-background p-2 md:sticky md:top-18 md:h-fit">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
