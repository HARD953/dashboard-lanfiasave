"use client";

import { EyeOff, MapPinned } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, EmptyState, PageHeader, Select, Spinner, Table, Td, Th } from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { TerritoryRow } from "@/lib/types";

const METRICS = {
  vulnerable_persons: "Personnes vulnérables",
  vulnerability_rate: "Taux de vulnérabilité",
  open_cases: "Dossiers d'opération ouverts",
  aids_delivered: "Aides remises",
  open_grievances: "Plaintes en cours",
} as const;
type Metric = keyof typeof METRICS;

function heat(ratio: number) {
  // Du turquoise pâle (faible) au rouge brique (fort) : lecture rapide des priorités.
  if (ratio > 0.75) return "bg-danger text-white";
  if (ratio > 0.5) return "bg-warning text-white";
  if (ratio > 0.25) return "bg-gold-500 text-navy-900";
  if (ratio > 0) return "bg-teal-100 text-teal-700";
  return "bg-navy-50 text-soft";
}

export default function TerritoriesPage() {
  const { organizationId } = useSession();
  const [metric, setMetric] = useState<Metric>("vulnerable_persons");
  const { data, isLoading } = useApi<{ min_cell: number; territories: TerritoryRow[] }>(
    organizationId ? `reports/territories/?organization=${organizationId}` : null,
  );
  const rows = [...(data?.territories ?? [])].sort((a, b) => (b[metric] ?? -1) - (a[metric] ?? -1));
  const max = Math.max(1, ...rows.map((r) => r[metric] ?? 0));

  return (
    <>
      <PageHeader
        title="Carte des vulnérabilités"
        subtitle="Où se concentrent les besoins, les dossiers et les aides, localité par localité : pour cibler les zones prioritaires et repérer celles qui sont oubliées."
        actions={
          <Select value={metric} onChange={(e) => setMetric(e.target.value as Metric)} className="w-64" aria-label="Indicateur">
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
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.slice(0, 12).map((r) => {
              const v = r[metric];
              return (
                <div key={r.territory ?? "none"} className={`rounded-card p-4 ${heat((v ?? 0) / max)}`}>
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="tabular mt-2 text-3xl font-bold">
                    {r.suppressed && (metric === "vulnerable_persons" || metric === "vulnerability_rate") ? (
                      <EyeOff className="size-6" aria-label="Effectif masqué" />
                    ) : metric === "vulnerability_rate" ? (
                      v === null ? "—" : `${v} %`
                    ) : (
                      formatNumber(v ?? 0)
                    )}
                  </p>
                  <p className="text-xs opacity-80">{METRICS[metric]}</p>
                </div>
              );
            })}
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
