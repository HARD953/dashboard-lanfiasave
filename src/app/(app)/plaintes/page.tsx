"use client";

import { AlarmClock, CheckCircle2, Inbox, Lock, MessageSquareWarning, Plus, Search } from "lucide-react";
import { useState } from "react";
import { FOLLOWUP_TONE, GrievanceDrawer, GrievanceModal } from "@/components/followup";
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, Spinner, Stat, Table, Td, Th } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Catalogs, Grievance } from "@/lib/types";

type Summary = { count: number; open: number; overdue: number; resolved: number; resolved_on_time_rate: number | null; by_category: Record<string, number> };

export default function GrievancesPage() {
  const { organizationId, can } = useSession();
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const [f, setF] = useState({ view: "open", category: "", priority: "", q: "" });
  const [creating, setCreating] = useState(false);
  const [current, setCurrent] = useState<Grievance | null>(null);
  const params = new URLSearchParams();
  if (organizationId) params.set("organization", organizationId);
  if (f.category) params.set("category", f.category);
  if (f.priority) params.set("priority", f.priority);
  if (f.q) params.set("search", f.q);
  const base = params.toString();
  if (f.view === "open") params.set("open", "true");
  if (f.view === "overdue") params.set("overdue", "true");
  if (f.view === "closed") params.set("status", "closed");
  params.set("ordering", f.view === "all" ? "-created_at" : "due_date");
  const { data, mutate, isLoading } = useApi<Paginated<Grievance>>(organizationId ? `grievances/?${params}` : null);
  const { data: summary, mutate: mutateSummary } = useApi<Summary>(organizationId ? `grievances/summary/?${base}` : null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const refresh = () => {
    mutate();
    mutateSummary();
  };
  const top = summary ? Object.entries(summary.by_category).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
  const maxCat = top[0]?.[1] ?? 1;

  return (
    <>
      <PageHeader
        title="Plaintes & réclamations"
        subtitle="Mécanisme de gestion des plaintes : chaque réclamation reçoit une référence, un délai de réponse et une réponse écrite. Les plaintes anonymes et sensibles sont protégées."
        actions={can("grievance.manage") && <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouvelle plainte</Button>}
      />
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="En cours" value={formatNumber(summary.open)} hint={`${formatNumber(summary.count)} reçues au total`} icon={<Inbox className="size-5" />} />
          <Stat label="Délai dépassé" value={formatNumber(summary.overdue)} hint="à traiter en priorité" icon={<AlarmClock className="size-5" />} accent="danger" />
          <Stat label="Résolues" value={formatNumber(summary.resolved)} icon={<CheckCircle2 className="size-5" />} accent="teal" />
          <Stat label="Résolues dans les délais" value={summary.resolved_on_time_rate === null ? "—" : `${summary.resolved_on_time_rate} %`} hint="indicateur de redevabilité" accent="gold" icon={<MessageSquareWarning className="size-5" />} />
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader title="Registre des plaintes" />
          <div className="grid gap-3 border-b border-line p-4 md:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
              <Input className="pl-9" placeholder="Référence, objet, nom…" value={f.q} onChange={set("q")} />
            </div>
            <Select value={f.view} onChange={set("view")} aria-label="Vue">
              <option value="open">En cours</option>
              <option value="overdue">Délai dépassé</option>
              <option value="closed">Clôturées</option>
              <option value="all">Toutes</option>
            </Select>
            <Select value={f.category} onChange={set("category")} aria-label="Catégorie">
              <option value="">Toutes catégories</option>
              {catalogs?.grievance_categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select value={f.priority} onChange={set("priority")} aria-label="Priorité">
              <option value="">Toutes priorités</option>
              {catalogs?.grievance_priorities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          {isLoading || !organizationId ? (
            <Spinner />
          ) : !data?.results.length ? (
            <EmptyState icon={<Inbox className="size-5" />} title="Aucune plainte dans cette vue" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Référence</Th>
                  <Th>Objet</Th>
                  <Th>Catégorie</Th>
                  <Th>Échéance</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((g) => (
                  <tr key={g.id} className="cursor-pointer hover:bg-navy-50" onClick={() => setCurrent(g)}>
                    <Td className="font-mono text-xs">{g.reference}</Td>
                    <Td>
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        {g.is_confidential && <Lock className="size-3.5 text-gold-600" />}
                        {g.subject}
                      </span>
                      <span className="text-xs text-muted">{g.anonymous ? "Anonyme" : g.person_name ?? g.complainant_name ?? "—"} · {g.channel_label}</span>
                    </Td>
                    <Td className="text-sm">{g.category_label}</Td>
                    <Td>
                      <span className={g.is_overdue ? "font-semibold text-danger" : "text-sm"}>{formatDate(g.due_date)}</span>
                      {g.priority !== "normal" && <span className="ml-2"><Badge tone={FOLLOWUP_TONE[g.priority]}>{g.priority_label}</Badge></span>}
                    </Td>
                    <Td><Badge tone={FOLLOWUP_TONE[g.status]}>{g.status_label}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card className="h-fit">
          <CardHeader title="Motifs les plus fréquents" subtitle="Pour corriger les causes, pas seulement les cas." />
          <ul className="space-y-3 p-5">
            {top.map(([cat, n]) => (
              <li key={cat}>
                <div className="flex justify-between text-sm">
                  <span>{catalogs?.grievance_categories.find((c) => c.value === cat)?.label ?? cat}</span>
                  <b className="tabular">{n}</b>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-navy-50">
                  <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${(100 * n) / maxCat}%` }} />
                </div>
              </li>
            ))}
            {!top.length && <li className="text-sm text-muted">Aucune donnée.</li>}
          </ul>
        </Card>
      </div>
      <GrievanceModal open={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refresh(); }} />
      <GrievanceDrawer grievance={current} onClose={() => setCurrent(null)} onChanged={() => { setCurrent(null); refresh(); }} />
    </>
  );
}
