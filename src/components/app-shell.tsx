"use client";

import clsx from "clsx";
import {
  BookOpen,
  Dices,
  FileStack,
  Gauge,
  ListChecks,
  ShieldAlert,
  Wallet,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FolderKanban,
  HandHeart,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareWarning,
  Route,
  ScrollText,
  Scale,
  Settings,
  Siren,
  Target,
  TrendingDown,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { useSession } from "@/lib/session";
import { ChangePasswordGate } from "./change-password";
import { Logo } from "./brand";
import { Select } from "./ui";

type Visible = (s: { can: (p: string) => boolean; isPlatformAdmin: boolean }) => boolean;
/** Première page accessible : un ministère ou un payeur n'a pas accès au tableau de bord général. */
export function homeFor(can: (p: string) => boolean, isPlatformAdmin = false) {
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.visible({ can, isPlatformAdmin })) return i.href;
  return "/tableau-de-bord";
}
type NavItem = { href: string; label: string; icon: typeof Users; visible: Visible };
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, visible: (s) => s.can("report.aggregate") },
      { href: "/pauvrete", label: "Lutte contre la pauvreté", icon: TrendingDown, visible: (s) => s.can("report.aggregate") },
      { href: "/indicateurs", label: "Cadre de suivi", icon: Target, visible: (s) => s.can("report.aggregate") },
      { href: "/territoires", label: "Carte des vulnérabilités", icon: MapPinned, visible: (s) => s.can("report.aggregate") },
    ],
  },
  {
    title: "Mines, pétrole, énergie",
    items: [
      { href: "/ministere", label: "Tableau du dispositif", icon: Gauge, visible: (s) => s.can("report.ministry") },
      {
        href: "/demandes",
        label: "Demandes des ménages",
        icon: FileStack,
        visible: (s) => s.can("claim.view") || s.can("claim.view_own") || s.can("claim.create") || s.can("claim.operator") || s.can("claim.evaluate"),
      },
      { href: "/paiements", label: "Paiements", icon: Wallet, visible: (s) => s.can("claim.pay") },
      { href: "/liste-exploitant", label: "Liste de l'exploitant", icon: ListChecks, visible: (s) => s.can("claim.import_list") },
      { href: "/plaintes-confidentielles", label: "Plaintes confidentielles", icon: ShieldAlert, visible: (s) => s.can("protected.view") || s.can("protected.file") },
      { href: "/evaluation", label: "Évaluation indépendante", icon: Dices, visible: (s) => s.can("claim.evaluate") },
    ],
  },
  {
    title: "Accompagnement",
    items: [
      { href: "/beneficiaires", label: "Bénéficiaires", icon: Users, visible: (s) => s.can("person.view") },
      { href: "/operations", label: "Opérations & sinistres", icon: Siren, visible: (s) => s.can("operation.view") },
      { href: "/visites", label: "Visites & agenda", icon: CalendarCheck, visible: (s) => s.can("visit.view") },
      { href: "/orientations", label: "Orientations", icon: Route, visible: (s) => s.can("referral.view") },
      { href: "/aides", label: "Aides apportées", icon: HandHeart, visible: (s) => s.can("assistance.view") },
    ],
  },
  {
    title: "Programmes",
    items: [
      { href: "/programmes", label: "Programmes", icon: FolderKanban, visible: (s) => s.can("program.view") },
      { href: "/instruction", label: "Instruction & comité", icon: ClipboardCheck, visible: (s) => s.can("application.view") },
      { href: "/partenaires", label: "Partenaires", icon: Building2, visible: (s) => s.can("partner.view") },
    ],
  },
  {
    title: "Redevabilité",
    items: [
      { href: "/plaintes", label: "Plaintes & réclamations", icon: MessageSquareWarning, visible: (s) => s.can("grievance.view") },
      { href: "/recours", label: "Recours", icon: Scale, visible: (s) => s.can("application.view") },
      { href: "/audit", label: "Journal d'audit", icon: ScrollText, visible: (s) => s.can("audit.view") },
    ],
  },
  {
    title: "Système",
    items: [
      {
        href: "/administration",
        label: "Administration",
        icon: Settings,
        visible: (s) => s.isPlatformAdmin || s.can("user.manage") || s.can("partner.manage"),
      },
      { href: "/methodes", label: "Méthodes & références", icon: BookOpen, visible: () => true },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap((g) => g.items);

function NavLinks({ onNavigate }: { onNavigate: () => void }) {
  const session = useSession();
  const pathname = usePathname();
  return (
    <>
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((n) => n.visible(session));
        if (!items.length) return null;
        return (
          <div key={group.title} className="pb-2">
            <p className="px-3 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40">{group.title}</p>
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
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
          </div>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const { me, loading, organizations, organizationId, setOrganizationId, membershipsInOrg, logout } = session;
  const [open, setOpen] = useState(false);

  const hasAccess = NAV.some((n) => n.href !== "/methodes" && n.visible(session));
  const roles = session.isPlatformAdmin
    ? "Administrateur de la plateforme"
    : membershipsInOrg.map((m) => m.role_label).join(" · ");

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
      <nav className="mt-1 flex-1 overflow-y-auto px-3">
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
          {me?.must_change_password ? (
            <ChangePasswordGate />
          ) : !loading && me && !hasAccess ? (
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
