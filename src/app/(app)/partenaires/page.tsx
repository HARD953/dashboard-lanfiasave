"use client";

import { Building2, HandHeart, Mail, Phone, Route, Search } from "lucide-react";
import { useState } from "react";
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Spinner } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Catalogs, Partner, Referral } from "@/lib/types";

type AidSummary = { delivered: number; delivered_amount: number; persons_helped: number };

function PartnerCard({ p }: { p: Partner }) {
  const { can } = useSession();
  const aids = useApi<AidSummary>(can("assistance.view") ? `assistances/summary/?organization=${p.organization}&provider=${p.id}` : null);
  const refs = useApi<Paginated<Referral>>(can("referral.view") ? `referrals/?organization=${p.organization}&partner=${p.id}&page_size=1` : null);
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-100 text-navy-800">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{p.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="info">{p.kind_label}</Badge>
            {p.acronym && <Badge>{p.acronym}</Badge>}
            {!p.is_active && <Badge tone="neutral">Inactive</Badge>}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-canvas p-3 text-center">
        <div>
          <p className="tabular text-lg font-bold text-navy-900">{formatNumber(aids.data?.delivered ?? 0)}</p>
          <p className="text-[11px] text-muted">aides remises</p>
        </div>
        <div>
          <p className="tabular text-lg font-bold text-navy-900">{formatNumber(aids.data?.persons_helped ?? 0)}</p>
          <p className="text-[11px] text-muted">personnes aidées</p>
        </div>
        <div>
          <p className="tabular text-lg font-bold text-navy-900">{formatNumber(refs.data?.count ?? 0)}</p>
          <p className="text-[11px] text-muted">orientations reçues</p>
        </div>
      </div>
      {!!aids.data?.delivered_amount && <p className="mt-2 text-xs text-muted">Valeur remise : {formatMoney(aids.data.delivered_amount)}</p>}
      <div className="mt-4 space-y-1 text-sm text-muted">
        {p.contact_name && <p>{p.contact_name}</p>}
        {p.phone && <p className="flex items-center gap-2"><Phone className="size-3.5" /> {p.phone}</p>}
        {p.email && <p className="flex items-center gap-2"><Mail className="size-3.5" /> {p.email}</p>}
      </div>
    </Card>
  );
}

export default function PartnersPage() {
  const { organizationId, can } = useSession();
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const { data, isLoading } = useApi<Partner[]>(organizationId ? `partners/?organization=${organizationId}` : null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const list = (data ?? []).filter(
    (p) => (!kind || p.kind === kind) && (!q || `${p.name} ${p.acronym}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader
        title="Structures partenaires"
        subtitle="Ministères, collectivités, entreprises, ONG et agences : qui intervient, qui apporte quelles aides, vers qui les personnes sont orientées."
        actions={
          <>
            {can("assistance.view") && <ButtonLink href="/aides" variant="secondary" icon={<HandHeart className="size-4" />}>Aides</ButtonLink>}
            {can("referral.view") && <ButtonLink href="/orientations" variant="secondary" icon={<Route className="size-4" />}>Orientations</ButtonLink>}
            {can("partner.manage") && <ButtonLink href="/administration" variant="accent">Gérer les structures</ButtonLink>}
          </>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_260px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
          <Input className="pl-9" placeholder="Rechercher une structure…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
          <option value="">Tous les types</option>
          {catalogs?.partner_kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
      </div>
      {isLoading || !organizationId ? (
        <Spinner />
      ) : !list.length ? (
        <Card><EmptyState icon={<Building2 className="size-5" />} title="Aucune structure" /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <PartnerCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}
