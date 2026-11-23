"use client";

import { EyeOff, ListOrdered, Map as MapIcon, MapPinned } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { heatColor, type MapPoint } from "@/lib/heat";
import { Card, CardHeader, EmptyState, PageHeader, Select, Spinner, Table, Td, Th } from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { TerritoryRow } from "@/lib/types";

// Leaflet a besoin du navigateur : la carte n'est pas rendue côté serveur.
const TerritoryMap = dynamic(() => import("@/components/territory-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse rounded-xl bg-navy-50" />,
});

const METRICS = {
  vulnerable_persons: "Personnes vulnérables",
  vulnerability_rate: "Taux de vulnérabilité",
  open_cases: "Dossiers d'opération ouverts",
  aids_delivered: "Aides remises",
  open_grievances: "Plaintes en cours",
} as const;
type Metric = keyof typeof METRICS;

export default function TerritoriesPage() {
  const { organizationId } = useSession();
  const [metric, setMetric] = useState<Metric>("vulnerable_persons");
  const { data, isLoading } = useApi<{ min_cell: number; territories: TerritoryRow[] }>(
    organizationId ? `reports/territories/?organization=${organizationId}` : null,
  );
  const rows = [...(data?.territories ?? [])].sort((a, b) => (b[metric] ?? -1) - (a[metric] ?? -1));
  const max = Math.max(1, ...rows.map((r) => r[metric] ?? 0));
  const show = (r: TerritoryRow) => {
    const v = r[metric];
    if (r.suppressed && (metric === "vulnerable_persons" || metric === "vulnerability_rate")) return "masqué";
    if (metric === "vulnerability_rate") return v === null ? "—" : `${v} %`;
    return formatNumber(v ?? 0);
  };
  // Localités situées sur la carte ; celles qui partagent un même point sont écartées en couronne.
  const points = useMemo<MapPoint[]>(() => {
    const located = rows.filter((r) => r.latitude !== null && r.longitude !== null);
    const seen = new Map<string, number>();
    return located.map((r) => {
      const k = `${r.latitude},${r.longitude}`;
      const i = seen.get(k) ?? 0;
      seen.set(k, i + 1);
      const angle = (i * 2 * Math.PI) / 6;
      const d = i ? 0.012 * Math.ceil(i / 6) : 0;
      return { ...r, latitude: r.latitude! + d * Math.sin(angle), longitude: r.longitude! + d * Math.cos(angle), value: r[metric] ?? 0 };
    });
  }, [rows, metric]);

  return (
    <>
      <PageHeader
        title="Carte des vulnérabilités"
        kicker="Pilotage"
        subtitle="Où se concentrent les besoins, les dossiers et les aides."
        actions={
          <Select value={metric} onChange={(e) => setMetric(e.target.value as Metric)} className="!w-64" aria-label="Indicateur">
            {Object.entries(METRICS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </Select>
        }
      />
      {isLoading || !organizationId ? (
        <Spinner />
      ) : !rows.length ? (
        <Card><EmptyState icon={<MapPinned className="size-5" />} title="Aucune donnée localisée" /></Card>
      ) : (
        <>
          <div className="mb-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            <Card className="p-2">
              <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1.5">
                <span className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                  <MapIcon className="size-4 text-navy-700" /> {METRICS[metric]} par localité
                </span>
                <span className="flex items-center gap-3 text-[11px] text-muted">
                  {[["Faible", 0.1], ["Moyen", 0.4], ["Élevé", 0.6], ["Très élevé", 0.9]].map(([l, r]) => (
                    <span key={l} className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full" style={{ background: heatColor(r as number) }} />
                      {l}
                    </span>
                  ))}
                </span>
              </div>
              <div className="isolate h-[460px]">
                {points.length ? (
                  <TerritoryMap points={points} metricLabel={METRICS[metric]} format={show} />
                ) : (
                  <EmptyState icon={<MapPinned className="size-5" />} title="Aucune localité positionnée" />
                )}
              </div>
            </Card>
            <Card>
              <CardHeader icon={ListOrdered} title="Localités prioritaires" />
              <ol className="divide-y divide-[#f0f5f9] px-2 py-1">
                {rows.slice(0, 10).map((r, i) => {
                  const v = r[metric] ?? 0;
                  return (
                    <li key={r.territory ?? "none"} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy-50 text-[11px] font-bold text-navy-800">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full" style={{ width: `${(100 * v) / max}%`, background: heatColor(v / max) }} />
                        </div>
                      </div>
                      <span className="tabular w-14 text-right text-[13px] font-bold text-ink">
                        {show(r) === "masqué" ? <EyeOff className="ml-auto size-4 text-soft" aria-label="Effectif masqué" /> : show(r)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </div>
          <Card>
            <CardHeader title="Détail par localité" subtitle={`Les effectifs inférieurs à ${data?.min_cell} personnes sont masqués pour éviter toute ré-identification.`} />
            <Table>
              <thead>
                <tr>
                  <Th>Localité</Th>
                  <Th className="text-right">Ménages</Th>
                  <Th className="text-right">Personnes</Th>
                  <Th className="text-right">Vulnérables</Th>
                  <Th className="text-right">Dossiers ouverts</Th>
                  <Th className="text-right">Aides remises</Th>
                  <Th className="text-right">Valeur</Th>
                  <Th className="text-right">Plaintes</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.territory ?? "none"}>
                    <Td className="font-medium text-ink">{r.name}</Td>
                    <Td className="tabular text-right">{formatNumber(r.households)}</Td>
                    <Td className="tabular text-right">{r.suppressed ? "< " + data?.min_cell : formatNumber(r.persons)}</Td>
                    <Td className="tabular text-right">
                      {r.suppressed ? "—" : `${formatNumber(r.vulnerable_persons)}${r.vulnerability_rate !== null ? ` (${r.vulnerability_rate} %)` : ""}`}
                    </Td>
                    <Td className="tabular text-right">{formatNumber(r.open_cases)}</Td>
                    <Td className="tabular text-right">{formatNumber(r.aids_delivered)}</Td>
                    <Td className="tabular text-right">{formatMoney(r.aid_amount)}</Td>
                    <Td className="tabular text-right">{formatNumber(r.open_grievances)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
