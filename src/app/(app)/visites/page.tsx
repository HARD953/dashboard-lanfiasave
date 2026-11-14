"use client";

import { CalendarClock, Home, Plus, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FOLLOWUP_TONE, VisitList, VisitModal } from "@/components/followup";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Select, Spinner, Stat } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Visit } from "@/lib/types";

type Agenda = {
  today: string;
  visits_due: Visit[];
  recertification_months: number;
  households_to_recertify: { id: string; public_code: string; territory: string | null; last_survey: string | null }[];
};

export default function VisitsPage() {
  const { organizationId, can } = useSession();
  const [trend, setTrend] = useState("");
  const [creating, setCreating] = useState(false);
  const agenda = useApi<Agenda>(organizationId ? `visits/agenda/?organization=${organizationId}&days=14` : null);
  const visits = useApi<Paginated<Visit>>(organizationId ? `visits/?organization=${organizationId}${trend ? `&trend=${trend}` : ""}` : null);
  const due = agenda.data?.visits_due ?? [];
  const overdue = due.filter((v) => v.overdue).length;
  const critical = visits.data?.results.filter((v) => v.trend === "critical" || v.trend === "worsened").length ?? 0;

  return (
    <>
      <PageHeader
        title="Visites & agenda de suivi"
        subtitle="Accompagnement régulier des ménages : visites à domicile, appels, évolution de la situation. Les ménages non mis à jour depuis plus de 24 mois sont signalés pour une revisite."
        actions={can("visit.record") && <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Compte rendu de visite</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Visites prévues (14 j)" value={formatNumber(due.length)} icon={<CalendarClock className="size-5" />} accent="teal" />
        <Stat label="Visites en retard" value={formatNumber(overdue)} icon={<CalendarClock className="size-5" />} accent="danger" />
        <Stat label="Situations en dégradation" value={formatNumber(critical)} hint="parmi les visites récentes" accent="gold" />
        <Stat label="Ménages à revisiter" value={formatNumber(agenda.data?.households_to_recertify.length)} hint={`dernière enquête > ${agenda.data?.recertification_months ?? 24} mois`} icon={<RefreshCcw className="size-5" />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="À visiter" subtitle="Prochaines visites prévues, les retards en premier." />
          {agenda.isLoading ? (
            <Spinner />
          ) : !due.length ? (
            <EmptyState icon={<CalendarClock className="size-5" />} title="Aucune visite prévue dans les 14 jours" />
          ) : (
            <ul className="divide-y divide-line">
              {due.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-24 shrink-0 text-sm">
                    <p className={v.overdue ? "font-semibold text-danger" : "font-semibold text-ink"}>{formatDate(v.next_visit_date)}</p>
                    {v.overdue && <p className="text-xs text-danger">en retard</p>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/beneficiaires/${v.person}`} className="text-sm font-semibold text-ink hover:underline">{v.person_name}</Link>
                    <p className="truncate text-xs text-muted">Dernière visite le {formatDate(v.visited_at)} · {v.summary}</p>
                  </div>
                  <Badge tone={FOLLOWUP_TONE[v.trend]}>{v.trend_label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Ménages à revisiter" subtitle="Mise à jour périodique du registre (pratique du Cadastro Único brésilien : tous les 2 ans)." />
          {!agenda.data?.households_to_recertify.length ? (
            <EmptyState icon={<Home className="size-5" />} title="Tous les ménages sont à jour" />
          ) : (
            <ul className="divide-y divide-line">
              {agenda.data.households_to_recertify.map((h) => (
                <li key={h.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    <b className="font-mono">{h.public_code}</b> <span className="text-muted">{h.territory ?? "—"}</span>
                  </span>
                  <span className="text-muted">{h.last_survey ? `enquête du ${formatDate(h.last_survey)}` : "jamais enquêté"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader
          title="Comptes rendus récents"
          action={
            <Select value={trend} onChange={(e) => setTrend(e.target.value)} aria-label="Évolution" className="h-9 w-56">
              <option value="">Toutes les évolutions</option>
              <option value="critical">Situation critique</option>
              <option value="worsened">En dégradation</option>
              <option value="stable">Stable</option>
              <option value="improved">En amélioration</option>
            </Select>
          }
        />
        {visits.isLoading ? <Spinner /> : <VisitList visits={visits.data?.results} showPerson />}
      </Card>
      <VisitModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          visits.mutate();
          agenda.mutate();
        }}
      />
    </>
  );
}
