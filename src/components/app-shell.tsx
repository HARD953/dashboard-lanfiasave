"use client";

import clsx from "clsx";
import {
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Scale,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { useSession } from "@/lib/session";
import { Logo } from "./brand";
import { Select } from "./ui";

const NAV = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, perm: "report.aggregate" },
  { href: "/beneficiaires", label: "Bénéficiaires", icon: Users, perm: "person.view" },
  { href: "/programmes", label: "Programmes", icon: FolderKanban, perm: "program.view" },
  { href: "/instruction", label: "Instruction & comité", icon: ClipboardCheck, perm: "application.view" },
  { href: "/recours", label: "Recours", icon: Scale, perm: "application.view" },
  { href: "/audit", label: "Journal d'audit", icon: ScrollText, perm: "audit.view" },
];

function NavLinks({ onNavigate }: { onNavigate: () => void }) {
  const { can } = useSession();
  const pathname = usePathname();
  return (
    <>
      {NAV.filter((n) => can(n.perm)).map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className={clsx("size-[18px]", active ? "text-teal-500" : "")} />
            {item.label}
            {active && <span className="ml-auto h-5 w-1 rounded-full bg-gold-500" />}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me, loading, can, organizations, organizationId, setOrganizationId, membershipsInOrg, logout } = useSession();
  const [open, setOpen] = useState(false);

  const hasAccess = NAV.some((n) => can(n.perm));
  const roles = membershipsInOrg.map((m) => m.role_label).join(" · ");

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo light />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu">
          <X className="size-5" />
        </button>
      </div>
      {organizations.length > 1 && (
        <div className="px-4 pb-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/50">Organisation</label>
          <Select
            value={organizationId ?? ""}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="border-white/15 bg-navy-800 text-white"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <nav className="mt-2 flex-1 space-y-0.5 px-3">
        <Suspense fallback={null}>
          <NavLinks onNavigate={() => setOpen(false)} />
        </Suspense>
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold">{me?.full_name ?? "…"}</p>
        <p className="truncate text-xs text-white/60">{roles || "—"}</p>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="size-6 text-navy-900" />
          </button>
          <Logo />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!loading && me && !hasAccess ? (
            <p className="text-sm text-muted">
              Votre compte n&apos;a encore aucune habilitation dans cette organisation. Contactez votre administrateur.
            </p>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
