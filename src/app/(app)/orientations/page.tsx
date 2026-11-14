"use client";

import { CheckCircle2, Hourglass, Plus, Route, Search, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FOLLOWUP_TONE, ReferralModal, ReferralUpdate } from "@/components/followup";
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, Spinner, Stat, Table, Td, Th } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Catalogs, Referral } from "@/lib/types";

type Summary = { count: number; open: number; completed: number; without_feedback_30d: number; completion_rate: number | null };

export default function ReferralsPage() {
  const { organizationId, can } = useSession();
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const [f, setF] = useState({ status: "", service: "", q: "" });
  const [creating, setCreating] = useState(false);
  const [current, setCurrent] = useState<Referral | null>(null);
  const params = new URLSearchParams();
  if (organizationId) params.set("organization", organizationId);
  if (f.service) params.set("service", f.service);
  if (f.q) params.set("search", f.q);
  const base = params.toString();
  if (f.status) params.set("status", f.status);
  const { data, mutate, isLoading } = useApi<Paginated<Referral>>(organizationId ? `referrals/?${params}` : null);
  const { data: summary, mutate: mutateSummary } = useApi<Summary>(organizationId ? `referrals/summary/?${base}` : null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const refresh = () => {
    mutate();
    mutateSummary();
  };

  return (
    <>
      <PageHeader
        title="Orientations vers les services"
        subtitle="État civil, CMU, école, santé, aide juridique, VBG… Chaque orientation attend le retour du service (contre-référence) : une personne orientée n'est pas une personne prise en charge."
        actions={can("referral.manage") && <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouvelle orientation</Button>}
      />
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="En attente de retour" value={formatNumber(summary.open)} icon={<Send className="size-5" />} />
          <Stat label="Sans retour depuis 30 j" value={formatNumber(summary.without_feedback_30d)} hint="relancer le service" icon={<Hourglass className="size-5" />} accent="danger" />
          <Stat label="Services rendus" value={formatNumber(summary.completed)} icon={<CheckCircle2 className="size-5" />} accent="teal" />
          <Stat label="Taux d'aboutissement" value={summary.completion_rate === null ? "—" : `${summary.completion_rate} %`} hint="sur les orientations clôturées" accent="gold" icon={<Route className="size-5" />} />
        </div>
      )}
      <Card>
        <CardHeader title="Registre des orientations" />
        <div className="grid gap-3 border-b border-line p-4 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
            <Input className="pl-9" placeholder="Référence, bénéficiaire…" value={f.q} onChange={set("q")} />
          </div>
          <Select value={f.status} onChange={set("status")} aria-label="Statut">
            <option value="">Tous les statuts</option>
            {catalogs?.referral_statuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Select value={f.service} onChange={set("service")} aria-label="Service">
            <option value="">Tous les services</option>
            {catalogs?.referral_services.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </div>
        {isLoading || !organizationId ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<Route className="size-5" />} title="Aucune orientation" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Bénéficiaire</Th>
                <Th>Service</Th>
                <Th>Structure</Th>
                <Th>Rendez-vous</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-navy-50" onClick={() => setCurrent(r)}>
                  <Td>
                    <Link href={`/beneficiaires/${r.person}`} className="font-medium text-ink hover:underline" onClick={(e) => e.stopPropagation()}>
                      {r.person_name}
                    </Link>
                    <span className="block font-mono text-xs text-muted">{r.reference}</span>
                  </Td>
                  <Td className="text-sm">
                    {r.service_label} {r.urgent && <Badge tone="danger">Urgent</Badge>}
                  </Td>
                  <Td className="text-sm">{r.partner_name ?? "—"}</Td>
                  <Td className="text-sm">{formatDate(r.appointment_date)}</Td>
                  <Td><Badge tone={FOLLOWUP_TONE[r.status]}>{r.status_label}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <ReferralModal open={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refresh(); }} />
      <ReferralUpdate referral={current} onClose={() => setCurrent(null)} onChanged={() => { setCurrent(null); refresh(); }} />
    </>
  );
}
