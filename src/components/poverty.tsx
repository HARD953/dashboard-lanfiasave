"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatNumber } from "@/lib/format";

export type Rates = { assessed: number; poor: number | null; rate: number | null; intensity: number | null; mpi: number | null; suppressed?: boolean };
export type PovertyReport = {
  summary: {
    units: number;
    assessed: number;
    incomplete: number;
    poor: number;
    severe: number;
    poverty_rate: number | null;
    severe_rate: number | null;
    intensity: number | null;
    mpi: number | null;
    monetary_poverty_rate: number | null;
    food_insecurity_rate: number | null;
    poor_covered: number;
    poor_coverage_rate: number | null;
    targeting_rate: number | null;
    deprivations_found: number;
    deprivations_handled: number;
    response_rate: number | null;
    fresh_rate: number | null;
  };
  dimensions: { code: string; label: string; contribution: number }[];
  indicators: {
    code: string;
    label: string;
    dimension: string;
    response: string;
    answered: number;
    deprived: number;
    rate: number | null;
    contribution: number | null;
    responsive: boolean;
    handled: number | null;
    unhandled: number | null;
    response_rate: number | null;
  }[];
  territories: (Rates & { name: string; main_deprivation: string | null })[];
  groups: { label: string; yes: Rates; no: Rates }[];
  trajectories: { followed: number; exited: number; entered: number; stayed_poor: number; stayed_non_poor: number; exit_rate: number | null; avg_score_change: number | null };
  series: { period: string; assessed: number; rate: number | null; mpi: number | null }[];
  gaps: { code: string; severity: "critical" | "high" | "medium" | "low"; count: number; label: string; action: string; href: string }[];
  methodology: {
    poverty_cutoff: number;
    severe_cutoff: number;
    poverty_line_monthly: number;
    dimensions: { code: string; label: string; weight: number; indicators: { code: string; label: string; weight: number; response: string }[] }[];
  };
  min_cell: number;
  priority?: {
    household: string | null;
    code: string;
    territory: string | null;
    head: { id: string; name: string; code: string } | null;
    score: number;
    severe: boolean;
    assessed_on: string;
    deprivations: string[];
    unhandled: string[];
    last_aid: string | null;
    last_visit: string | null;
  }[];
};

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${String(v).replace(".", ",")} %`);

export const SEVERITY = {
  critical: { label: "Urgent", tone: "danger" as const, icon: AlertOctagon },
  high: { label: "Prioritaire", tone: "warning" as const, icon: AlertTriangle },
  medium: { label: "À traiter", tone: "info" as const, icon: Info },
  low: { label: "À planifier", tone: "neutral" as const, icon: Info },
};

export function GapList({ gaps, limit }: { gaps: PovertyReport["gaps"]; limit?: number }) {
  const open = gaps.filter((g) => g.count > 0);
  const shown = limit ? open.slice(0, limit) : open;
  if (!open.length)
    return (
      <p className="flex items-center gap-2 p-5 text-sm text-success">
        <CheckCircle2 className="size-4" /> Aucun besoin constaté sans réponse.
      </p>
    );
  return (
    <ul className="divide-y divide-line">
      {shown.map((g) => {
        const s = SEVERITY[g.severity];
        return (
          <li key={g.code} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <span className="tabular w-12 text-right text-2xl font-bold text-navy-900">{formatNumber(g.count)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{g.label}</p>
              <p className="text-sm text-muted">{g.action}</p>
            </div>
            <Badge tone={s.tone}>
              <s.icon className="size-3.5" /> {s.label}
            </Badge>
            <Link href={g.href} className="text-sm font-semibold text-teal-700 hover:underline">
              Agir →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

