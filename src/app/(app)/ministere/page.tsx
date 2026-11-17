"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, Badge, Card, CardHeader, PageHeader, Spinner, Table, Td, Th } from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";

type Indicator = {
  code: string;
  label: string;
  value: number | null;
  unit: string;
  target: string;
  ok?: boolean;
  numerator?: number;
  denominator?: number;
  secondary?: number | null;
  secondary_label?: string;
};
type Count = { code: string; label: string; count: number };
type Dashboard = {
  generated_at: string;
  summary: Record<string, number>;
  key_indicators: Indicator[];
  complementary_indicators: Indicator[];
  by_channel: Count[];
  by_sector: Count[];
  by_impact: Count[];
  by_status: Count[];
  decisions: Count[];
  protected_by_kind: Count[];
  territories: { name: string; level: string; claims: number; open: number; overdue: number; women_share: number | null; median_delay: number | null; urgent: number }[];
  months: { month: string; registered: number; decided: number }[];
  min_zone: number;
};
type Fairness = {
  since: string;
  claims: number;
  note: string;
  dimensions: { dimension: string; gap: number | null; alert: boolean; rows: { group: string; claims: number | null; avg_priority: number | null; eligible_rate: number | null; median_delay: number | null; suppressed: boolean }[] }[];
};

function fmt(i: Indicator) {
  if (i.value === null || i.value === undefined) return "—";
  return i.unit === "%" ? `${String(i.value).replace(".", ",")} %` : i.unit === "jours" ? `${String(i.value).replace(".", ",")} j` : formatNumber(i.value);
}

function Bars({ title, rows, subtitle }: { title: string; rows: Count[]; subtitle?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <ul className="space-y-2.5 p-5">
        {rows.filter((r) => r.count > 0).map((r) => (
          <li key={r.code} title={`${r.label} : ${r.count}`}>
            <div className="flex justify-between gap-2 text-sm"><span>{r.label}</span><b className="tabular">{formatNumber(r.count)}</b></div>
            <div className="mt-1 h-1.5 rounded-full bg-navy-50"><div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${(100 * r.count) / max}%` }} /></div>
          </li>
        ))}
        {!rows.some((r) => r.count) && <li className="text-sm text-muted">Aucune donnée.</li>}
      </ul>
    </Card>
  );
}

export default function MinistryPage() {
  const { organizationId } = useSession();
  const { data, error, isLoading } = useApi<Dashboard>(organizationId ? `reports/ministry/?organization=${organizationId}` : null);
  const { data: fair } = useApi<Fairness>(organizationId ? `reports/ministry/fairness/?organization=${organizationId}` : null);
  if (isLoading || !organizationId) return <Spinner />;
  if (error || !data) return <Alert tone="danger">{error?.message ?? "Tableau de bord indisponible."}</Alert>;
  const s = data.summary;
  const maxMonth = Math.max(1, ...data.months.flatMap((m) => [m.registered, m.decided]));

  return (
    <>
      <PageHeader
        title="Tableau de bord du dispositif"
        subtitle="Vue agrégée pour le ministère, sans aucun nom. Mines, pétrole, énergie : demandes, délais, décisions, accompagnement, plaintes et articulation avec l'exploitant."
      />
      <Alert tone="info">
        <span className="flex items-center gap-2"><ShieldCheck className="size-4" />Aucune donnée nominative. Toute zone de moins de {data.min_zone} ménages est fusionnée avec la zone voisine. Mis à jour le {formatDate(data.generated_at, true)}.</span>
      </Alert>

      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Les trois indicateurs qui décident de l&apos;extension</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {data.key_indicators.map((i) => (
          <Card key={i.code} className={clsx("p-5", i.ok ? "ring-1 ring-success/30" : "")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted">{i.label}</p>
              {i.value !== null && (i.ok ? <Badge tone="success"><CheckCircle2 className="size-3" />Cible tenue</Badge> : <Badge tone="warning"><AlertTriangle className="size-3" />Sous la cible</Badge>)}
            </div>
            <p className="tabular mt-2 text-4xl font-bold text-navy-900">{fmt(i)}</p>
            <p className="mt-1 text-xs text-muted">Cible : {i.target}</p>
            {i.denominator !== undefined && <p className="text-xs text-muted">{formatNumber(i.numerator)} sur {formatNumber(i.denominator)}</p>}
            {i.secondary !== undefined && i.secondary !== null && <p className="text-xs text-muted">{String(i.secondary).replace(".", ",")} % {i.secondary_label}</p>}
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Demandes reçues", s.claims],
          ["En cours", s.open],
          ["En retard", s.overdue],
          ["Urgences", s.urgent],
          ["Ménages éligibles", s.eligible],
          ["Absents de la liste de l'exploitant", s.absent_from_operator_list],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-4">
            <p className="text-xs text-muted">{l}</p>
            <p className="tabular mt-1 text-2xl font-bold text-navy-900">{formatNumber(v as number)}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Sept indicateurs complémentaires" subtitle="Suivis chaque mois ; cibles indicatives à arrêter par le comité de pilotage au mois 1." />
        <Table>
          <thead><tr><Th>Indicateur</Th><Th>Valeur</Th><Th>Cible indicative</Th></tr></thead>
          <tbody>
            {data.complementary_indicators.map((i) => (
              <tr key={i.code}>
                <Td className="font-medium text-ink">{i.label}</Td>
                <Td className="tabular">
                  {fmt(i)}
                  {i.denominator !== undefined && <span className="ml-2 text-xs text-muted">({formatNumber(i.numerator)}/{formatNumber(i.denominator)})</span>}
                  {i.secondary_label && <span className="ml-2 text-xs text-muted">sur {formatNumber(i.secondary)} {i.secondary_label}</span>}
                </Td>
                <Td className="text-sm text-muted">{i.target}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Demandes reçues et décisions rendues, par mois" />
        <div className="flex items-end gap-4 p-5" style={{ height: 180 }}>
          {data.months.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div className="w-1/3 rounded-t bg-navy-700" style={{ height: `${(100 * m.registered) / maxMonth}%` }} title={`Reçues : ${m.registered}`} />
                <div className="w-1/3 rounded-t bg-teal-500" style={{ height: `${(100 * m.decided) / maxMonth}%` }} title={`Décidées : ${m.decided}`} />
              </div>
              <span className="text-xs text-muted">{new Date(m.month).toLocaleDateString("fr-FR", { month: "short" })}</span>
            </div>
          ))}
        </div>
        <p className="flex gap-4 px-5 pb-4 text-xs text-muted"><span><span className="mr-1 inline-block size-2 rounded-sm bg-navy-700" />Reçues</span><span><span className="mr-1 inline-block size-2 rounded-sm bg-teal-500" />Décidées</span></p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Bars title="Par canal" rows={data.by_channel} subtitle="Le canal de proximité sert-il les personnes non connectées ?" />
        <Bars title="Par secteur" rows={data.by_sector} />
        <Bars title="Par type d'impact" rows={data.by_impact.slice(0, 8)} />
        <Bars title="Décisions" rows={data.decisions} subtitle="Appuis, orientations, rejets motivés" />
        <Bars title="Où en sont les dossiers" rows={data.by_status} />
        <Bars title="Plaintes confidentielles" rows={data.protected_by_kind} subtitle="Nombre seulement : le contenu reste au membre indépendant." />
      </div>

      <Card className="mt-6">
        <CardHeader title="Par zone" subtitle={`Sous-préfecture, département ou région ; zones de moins de ${data.min_zone} ménages fusionnées.`} />
        <Table>
          <thead><tr><Th>Zone</Th><Th>Demandes</Th><Th>En cours</Th><Th>En retard</Th><Th>Urgences</Th><Th>Part des femmes</Th><Th>Délai médian</Th></tr></thead>
          <tbody>
            {data.territories.map((t) => (
              <tr key={t.name}>
                <Td><span className="font-medium text-ink">{t.name}</span> <span className="text-xs text-muted">{t.level}</span></Td>
                <Td className="tabular">{t.claims}</Td>
                <Td className="tabular">{t.open}</Td>
                <Td className={clsx("tabular", t.overdue && "font-semibold text-danger")}>{t.overdue}</Td>
                <Td className="tabular">{t.urgent}</Td>
                <Td className="tabular">{t.women_share === null ? "—" : `${t.women_share} %`}</Td>
                <Td className="tabular">{t.median_delay === null ? "—" : `${t.median_delay} j`}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {fair && (
        <Card className="mt-6">
          <CardHeader title="Contrôle trimestriel des écarts" subtitle={`Depuis le ${formatDate(fair.since)} · ${fair.claims} demandes. Le score n'utilise ni le sexe, ni l'âge, ni la localité : on vérifie qu'il n'en résulte pas d'écart.`} />
          <div className="grid gap-6 p-5 lg:grid-cols-3">
            {fair.dimensions.map((d) => (
              <div key={d.dimension}>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  {d.dimension}
                  {d.alert ? <Badge tone="warning">Écart de {d.gap} points</Badge> : d.gap !== null && <Badge tone="success">Écart {d.gap} pts</Badge>}
                </p>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted"><th className="py-1">Groupe</th><th>Dem.</th><th>Prio.</th><th>Éligibles</th></tr></thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.group} className="border-t border-line">
                        <td className="py-1.5">{r.group}</td>
                        <td className="tabular">{r.suppressed ? "< 3" : r.claims}</td>
                        <td className="tabular">{r.avg_priority ?? "—"}</td>
                        <td className="tabular">{r.eligible_rate === null ? "—" : `${r.eligible_rate} %`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 text-xs text-muted">{fair.note}</p>
        </Card>
      )}
    </>
  );
}
