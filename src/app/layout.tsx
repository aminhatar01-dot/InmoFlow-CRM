import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InmoFlow CRM",
  description: "CRM inmobiliario multi-tenant para equipos comerciales"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
