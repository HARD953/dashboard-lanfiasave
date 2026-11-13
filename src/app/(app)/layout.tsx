import { AppShell } from "@/components/app-shell";
import { SessionProvider } from "@/lib/session";

/** Espaces métier : les données sont chargées côté navigateur via le relais authentifié /api/backend. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
