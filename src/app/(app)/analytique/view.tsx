"use client";

/**
 * Analytique : l'activité du dispositif sur la période choisie, comparée à la période précédente de même durée.
 * Filtres (période, zone, programme, sexe), indicateurs avec évolution, courbes, ventilations et exports CSV.
 * API : /reports/analytics/ (chiffres agrégés, sans aucun nom).
 */
import clsx from "clsx";
import {
  BarChart3, CalendarRange, Download, FileStack, HandCoins, HandHeart, Home, Layers, LineChart as LineIcon,
  MessageSquareWarning, Printer, RotateCcw, Route, Users, CalendarCheck, CheckCircle2, Pickaxe,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Alert, Badge, Button, Card, CardHeader, PageHeader, Select, Spinner, Stat } from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";

type Grain = "day" | "week" | "month";
type Dim = "region" | "department" | "commune" | "program" | "aid_category" | "sex";
type Summary = { key: string; label: string; value: number; previous: number; evolution: number | null };
type Row = { key: string; label: string; detail: string } & Record<string, number | string>;
type Report = {
  start: string; end: string; previous_start: string; previous_end: string; grain: Grain;
  metrics: { key: string; label: string; money: boolean }[];
  summary: Summary[];
  series: ({ period: string } & Record<string, number | string>)[];
  breakdowns: Record<Dim, Row[]>;
};
type Territory = { id: string; name: string; level: string; parent_name: string | null };
type Program = { id: string; name: string };

const C = { blue: "#1A8FD1", blueD: "#0D6FAB", blueL: "#4FB3E8", navy: "#0D4E7A", green: "#0A9E7A", amber: "#D08A00",
  muted: "#5A7A92", line: "#D4E4F0", surface: "#F0F5F9" };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ago = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const PERIODS: { value: string; label: string; range: () => [string, string] }[] = [
  { value: "30", label: "30 jours", range: () => [iso(ago(29)), iso(new Date())] },
  { value: "90", label: "3 mois", range: () => [iso(ago(89)), iso(new Date())] },
  { value: "180", label: "6 mois", range: () => [iso(ago(179)), iso(new Date())] },
  { value: "365", label: "12 mois", range: () => [iso(ago(364)), iso(new Date())] },
  { value: "annee", label: "Cette année", range: () => [iso(new Date(new Date().getFullYear(), 0, 1)), iso(new Date())] },
];

/** Les indicateurs mis en avant (cartes du haut) et leur icône. */
const KPIS: { key: string; icon: ReactNode; accent: "navy" | "teal" | "gold" | "danger" | "success" }[] = [
  { key: "households", icon: <Home />, accent: "navy" },
  { key: "persons", icon: <Users />, accent: "navy" },
  { key: "applications", icon: <FileStack />, accent: "teal" },
  { key: "approvals", icon: <CheckCircle2 />, accent: "success" },
  { key: "aids", icon: <HandHeart />, accent: "success" },
  { key: "aid_amount", icon: <HandCoins />, accent: "gold" },
  { key: "visits", icon: <CalendarCheck />, accent: "teal" },
  { key: "referrals", icon: <Route />, accent: "teal" },
  { key: "grievances", icon: <MessageSquareWarning />, accent: "danger" },
  { key: "claims", icon: <Pickaxe />, accent: "gold" },
];
const DIMS: { value: Dim; label: string }[] = [
  { value: "region", label: "Régions et districts" }, { value: "department", label: "Départements" },
  { value: "commune", label: "Communes" }, { value: "program", label: "Programmes" },
  { value: "aid_category", label: "Types d'aide" }, { value: "sex", label: "Sexe" },
];
const COLUMNS: { key: string; label: string; money?: boolean }[] = [
  { key: "persons", label: "Personnes" }, { key: "households", label: "Ménages" },
  { key: "applications", label: "Demandes" }, { key: "approvals", label: "Accordées" },
  { key: "aids", label: "Aides" }, { key: "aid_amount", label: "Montant (FCFA)", money: true },
  { key: "grievances", label: "Plaintes" }, { key: "claims", label: "Mines, pétrole, énergie" },
];
const DIM_COLUMNS: Record<Dim, string[]> = {
  region: COLUMNS.map((c) => c.key), department: COLUMNS.map((c) => c.key), commune: COLUMNS.map((c) => c.key),
  program: ["applications", "approvals", "aids", "aid_amount", "grievances"],
  aid_category: ["aids", "aid_amount"],
  sex: ["persons", "applications", "approvals", "aids", "aid_amount", "claims"],
};

const fmtCompact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(".", ",")} M` : v >= 1e4 ? `${Math.round(v / 1e3)} k` : formatNumber(v));
const fmtValue = (v: number, money: boolean) => (money ? `${formatNumber(v)} F` : formatNumber(v));
const periodLabel = (p: string, grain: Grain) => {
  const d = new Date(`${p}T00:00:00`);
  if (grain === "month") return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  return `${grain === "week" ? "sem. " : ""}${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
};
const fmtDate = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/** Fichier CSV lisible par Excel (point-virgule, BOM UTF-8). */
function saveCsv(rows: (string | number)[][], filename: string) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Evolution({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span className="text-soft">—</span>;
  return <Badge tone={v >= 0 ? "success" : "danger"}>{v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(1).replace(".", ",")} %</Badge>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "h-8 rounded-[10px] px-3 text-xs font-semibold transition",
        active ? "bg-navy-700 text-white shadow-sm" : "border border-[#c0d4e6] bg-white text-[#2a4a62] hover:bg-navy-50",
      )}
    >
      {children}
    </button>
  );
}

export default function AnalyticsView() {
  const { me, organizationId, can } = useSession();
  const allowed = can("report.aggregate");
  const [period, setPeriod] = useState("365");
  const [[start, end], setRange] = useState<[string, string]>(PERIODS[3].range());
  const [grain, setGrain] = useState<"" | Grain>("");
  const [territory, setTerritory] = useState("");
  const [program, setProgram] = useState("");
  const [sex, setSex] = useState("");
  const [metric, setMetric] = useState("households");
  const [dim, setDim] = useState<Dim>("region");

  const params = new URLSearchParams({ organization: organizationId ?? "", start, end });
  if (grain) params.set("grain", grain);
  if (territory) params.set("territory", territory);
  if (program) params.set("program", program);
  if (sex) params.set("sex", sex);
  const { data: r, error, isLoading, isValidating } = useApi<Report>(allowed && organizationId ? `reports/analytics/?${params}` : null,
    { keepPreviousData: true });
  const { data: regions } = useApi<Territory[]>(allowed ? "territories/?level=region" : null);
  const { data: departments } = useApi<Territory[]>(allowed ? "territories/?level=department" : null);
  const { data: programs } = useApi<{ results: Program[] } | Program[]>(allowed && organizationId ? `programs/?organization=${organizationId}&page_size=200` : null);
  const programList = Array.isArray(programs) ? programs : programs?.results ?? [];

  const bySummary = useMemo(() => Object.fromEntries((r?.summary ?? []).map((s) => [s.key, s])), [r]);
  const meta = useMemo(() => Object.fromEntries((r?.metrics ?? []).map((m) => [m.key, m])), [r]);
  const chart = useMemo(() => (r?.series ?? []).map((p) => ({ ...p, label: periodLabel(p.period, r!.grain) })), [r]);
  const filters = [territory, program, sex].filter(Boolean).length;

  if (!me || !organizationId) return <Spinner />;
  if (!allowed) return <Alert tone="warning">L&apos;analytique est réservée aux comptes qui voient les indicateurs agrégés.</Alert>;

  const exportSeries = () => {
    if (!r) return;
    const keys = r.metrics.map((m) => m.key);
    saveCsv([
      ["Période", ...r.metrics.flatMap((m) => [m.label, `${m.label} (période précédente)`])],
      ...r.series.map((p) => [String(p.period), ...keys.flatMap((k) => [Number(p[k] ?? 0), Number(p[`${k}_previous`] ?? 0)])]),
    ], `lanfiasave_evolution_${r.start}_${r.end}.csv`);
  };
  const exportSummary = () => {
    if (!r) return;
    saveCsv([
      ["Indicateur", `Du ${r.start} au ${r.end}`, `Du ${r.previous_start} au ${r.previous_end}`, "Évolution (%)"],
      ...r.summary.map((s) => [s.label, s.value, s.previous, s.evolution ?? ""]),
    ], `lanfiasave_synthese_${r.start}_${r.end}.csv`);
  };
  const exportBreakdown = () => {
    if (!r) return;
    const cols = COLUMNS.filter((c) => DIM_COLUMNS[dim].includes(c.key));
    saveCsv([
      [DIMS.find((d) => d.value === dim)!.label, "Rattachement", ...cols.map((c) => c.label)],
      ...r.breakdowns[dim].map((x) => [x.label, x.detail, ...cols.map((c) => Number(x[c.key] ?? 0))]),
    ], `lanfiasave_${dim}_${r.start}_${r.end}.csv`);
  };

  const m = meta[metric];
  const rows = r?.breakdowns[dim] ?? [];
  const cols = COLUMNS.filter((c) => DIM_COLUMNS[dim].includes(c.key));
  const lead = cols[0]?.key;
  const leadMax = Math.max(1, ...rows.map((x) => Number(x[lead] ?? 0)));

  return (
    <div className="space-y-4 print:space-y-3">
      <PageHeader
        kicker="Pilotage"
        title="Analytique"
        subtitle={r ? `Du ${fmtDate(r.start)} au ${fmtDate(r.end)}, comparé au ${fmtDate(r.previous_start)} – ${fmtDate(r.previous_end)}` : undefined}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportSummary} disabled={!r}>Synthèse CSV</Button>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportSeries} disabled={!r}>Évolution CSV</Button>
            <Button icon={<Printer className="size-4" />} onClick={() => window.print()} disabled={!r}>Imprimer</Button>
          </div>
        }
      />

      {/* Filtres */}
      <Card className="p-3.5 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="size-4 text-navy-700" />
          {PERIODS.map((p) => (
            <Chip key={p.value} active={period === p.value} onClick={() => { setPeriod(p.value); setRange(p.range()); }}>{p.label}</Chip>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
          <input type="date" aria-label="Début" value={start} max={end} onChange={(e) => { setPeriod("perso"); setRange([e.target.value, end]); }}
            className="h-8 rounded-[10px] border border-[#c0d4e6] px-2 text-xs text-ink" />
          <span className="text-xs text-muted">au</span>
          <input type="date" aria-label="Fin" value={end} min={start} onChange={(e) => { setPeriod("perso"); setRange([start, e.target.value]); }}
            className="h-8 rounded-[10px] border border-[#c0d4e6] px-2 text-xs text-ink" />
          <Select aria-label="Détail des courbes" value={grain} onChange={(e) => setGrain(e.target.value as "" | Grain)} className="!h-8 !w-auto text-xs">
            <option value="">Détail automatique</option><option value="day">Par jour</option>
            <option value="week">Par semaine</option><option value="month">Par mois</option>
          </Select>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/70 pt-2.5">
          <Layers className="size-4 text-navy-700" />
          <Select aria-label="Zone" value={territory} onChange={(e) => setTerritory(e.target.value)} className="!h-8 !w-auto max-w-56 text-xs">
            <option value="">Toutes les zones</option>
            {regions?.length ? <optgroup label="Régions">{regions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup> : null}
            {departments?.length ? <optgroup label="Départements">{departments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup> : null}
          </Select>
          <Select aria-label="Programme" value={program} onChange={(e) => setProgram(e.target.value)} className="!h-8 !w-auto max-w-56 text-xs">
            <option value="">Tous les programmes</option>
            {programList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select aria-label="Sexe" value={sex} onChange={(e) => setSex(e.target.value)} className="!h-8 !w-auto text-xs">
            <option value="">Femmes et hommes</option><option value="F">Femmes</option><option value="M">Hommes</option>
          </Select>
          {filters > 0 && (
            <button onClick={() => { setTerritory(""); setProgram(""); setSex(""); }}
              className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2.5 text-xs font-semibold text-muted hover:bg-navy-50">
              <RotateCcw className="size-3.5" /> Effacer ({filters})
            </button>
          )}
          {isValidating && r && <span className="text-xs text-muted">Mise à jour…</span>}
        </div>
      </Card>

      {error && <Alert tone="danger">{error.message}</Alert>}
      {!r ? (isLoading ? <Spinner /> : null) : (
        <div className={clsx("space-y-4 transition-opacity", isValidating && "opacity-70")}>
          {/* Indicateurs : cliquer une carte l'affiche dans la courbe */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {KPIS.map((k) => {
              const s = bySummary[k.key];
              if (!s) return null;
              return (
                <button key={k.key} type="button" onClick={() => setMetric(k.key)}
                  className={clsx("rounded-card text-left transition", metric === k.key ? "ring-2 ring-navy-700 ring-offset-2 ring-offset-canvas" : "hover:-translate-y-0.5")}>
                  <Stat label={s.label} value={meta[k.key]?.money ? fmtCompact(s.value) + " F" : formatNumber(s.value)}
                    growth={s.evolution} hint={`Avant : ${fmtValue(s.previous, !!meta[k.key]?.money)}`} icon={k.icon} accent={k.accent} />
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader icon={BarChart3} title={`${m?.label ?? ""} · ${r.grain === "day" ? "par jour" : r.grain === "week" ? "par semaine" : "par mois"}`}
                subtitle="Barres : la période choisie. Zone grise : la période précédente, au même rang."
                action={
                  <Select aria-label="Indicateur" value={metric} onChange={(e) => setMetric(e.target.value)} className="!h-8 !w-auto max-w-60 text-xs print:hidden">
                    {r.metrics.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                  </Select>
                } />
              <div className="h-72 px-3 pb-3 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: C.line }} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={fmtCompact} width={44} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(26,143,209,0.06)" }} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }}
                      formatter={(v, n) => [fmtValue(Number(v), !!m?.money), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                    <Area type="monotone" dataKey={`${metric}_previous`} name="Période précédente" stroke={C.muted} strokeDasharray="4 3" fill={C.surface} />
                    <Bar dataKey={metric} name="Période choisie" fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader icon={LineIcon} title="Du besoin à l'aide" subtitle="Demandes déposées, accordées et aides remises sur la période." />
              <div className="h-72 px-3 pb-3 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: C.line }} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted }} width={36} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="applications" name="Demandes" stroke={C.navy} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="approvals" name="Accordées" stroke={C.blueL} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="aids" name="Aides remises" stroke={C.green} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader icon={Layers} title="Ventilation"
              action={<Button variant="secondary" icon={<Download className="size-4" />} onClick={exportBreakdown} className="print:hidden">CSV</Button>} />
            <div className="flex flex-wrap gap-1.5 px-5 pt-3.5 print:hidden">
              {DIMS.map((d) => (
                <Chip key={d.value} active={dim === d.value} onClick={() => setDim(d.value)}>
                  {d.label} <span className="opacity-70">({r.breakdowns[d.value].length})</span>
                </Chip>
              ))}
            </div>
            <div className="overflow-x-auto p-2 pt-3">
              {rows.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">Aucune activité sur la période et les filtres choisis.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap border-b border-line px-3 py-2 text-[10.5px] font-bold uppercase tracking-wide text-muted">{DIMS.find((d) => d.value === dim)!.label}</th>
                      {cols.map((c, i) => (
                        <th key={c.key} className="whitespace-nowrap border-b border-line px-3 py-2 text-right text-[10.5px] font-bold uppercase tracking-wide text-muted">
                          {c.label}{i === 0 && " · part"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((x) => (
                      <tr key={x.key} className="hover:bg-navy-50/60">
                        <td className="border-b border-[#f0f5f9] px-3 py-2 text-[13px]">
                          <span className="font-semibold text-ink">{x.label}</span>
                          {x.detail && <span className="block text-[11px] text-muted">{x.detail}</span>}
                        </td>
                        {cols.map((c, i) => (
                          <td key={c.key} className="tabular border-b border-[#f0f5f9] px-3 py-2 text-right text-[13px] text-ink">
                            {i === 0 ? (
                              <span className="flex items-center justify-end gap-2">
                                <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-canvas sm:block">
                                  <span className="block h-full rounded-full bg-navy-700" style={{ width: `${(100 * Number(x[c.key] ?? 0)) / leadMax}%` }} />
                                </span>
                                <b>{formatNumber(Number(x[c.key] ?? 0))}</b>
                              </span>
                            ) : formatNumber(Number(x[c.key] ?? 0))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Tous les indicateurs" />
            <div className="grid gap-x-6 px-5 py-2 sm:grid-cols-2">
              {r.summary.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-3 border-b border-[#f0f5f9] py-2 text-[13px]">
                  <span className="text-[#2a4a62]">{s.label}</span>
                  <span className="flex items-center gap-2">
                    <b className="tabular text-ink">{fmtValue(s.value, !!meta[s.key]?.money)}</b>
                    <Evolution v={s.evolution} />
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
