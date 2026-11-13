"use client";

import { HandHeart, Search, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { AidList } from "@/components/aid";
import { Card, CardHeader, Input, PageHeader, Select, Spinner, Stat } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Assistance, Catalogs, Operation, Partner } from "@/lib/types";

type Summary = {
  count: number;
  delivered: number;
  planned: number;
  cancelled: number;
  delivered_amount: number;
  planned_amount: number;
  persons_helped: number;
  by_category: Record<string, number>;
};

export default function AidsPage() {
  const { organizationId } = useSession();
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const { data: partners } = useApi<Partner[]>(organizationId ? `partners/?organization=${organizationId}` : null);
  const { data: operations } = useApi<Paginated<Operation>>(organizationId ? `operations/?organization=${organizationId}` : null);
  const [f, setF] = useState({ status: "", category: "", provider: "", operation: "", q: "" });
  const [page, setPage] = useState(1);
  const params = new URLSearchParams();
  if (organizationId) params.set("organization", organizationId);
  if (f.status) params.set("status", f.status);
  if (f.category) params.set("category", f.category);
  if (f.provider) params.set("provider", f.provider);
  if (f.operation) params.set("operation_case__operation", f.operation);
  if (f.q) params.set("search", f.q);
  const summaryParams = params.toString();
  params.set("page", String(page));
  const { data, mutate, isLoading } = useApi<Paginated<Assistance>>(organizationId ? `assistances/?${params}` : null);
  const { data: summary, mutate: mutateSummary } = useApi<Summary>(organizationId ? `assistances/summary/?${summaryParams}` : null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };
  const pages = data ? Math.max(1, Math.ceil(data.count / 25)) : 1;

  return (
    <>
      <PageHeader
        title="Aides apportées"
        subtitle="Chaque aide est rattachée à une personne, à une structure et à une preuve de remise. Rien n'est supprimé."
      />
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Aides remises" value={formatNumber(summary.delivered)} hint={`${formatNumber(summary.planned)} planifiées`} icon={<HandHeart className="size-5" />} accent="teal" />
          <Stat label="Valeur remise" value={formatMoney(summary.delivered_amount)} hint={`${formatMoney(summary.planned_amount)} encore planifiés`} icon={<Wallet className="size-5" />} accent="gold" />
          <Stat label="Personnes aidées" value={formatNumber(summary.persons_helped)} icon={<Users className="size-5" />} />
          <Stat label="Annulées" value={formatNumber(summary.cancelled)} hint="avec motif, conservées pour l'audit" />
        </div>
      )}
      <Card>
        <CardHeader title="Registre des aides" />
        <div className="grid gap-3 border-b border-line p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
            <Input className="pl-9" placeholder="Bénéficiaire, code, preuve…" value={f.q} onChange={set("q")} />
          </div>
          <Select value={f.status} onChange={set("status")} aria-label="Statut">
            <option value="">Tous les statuts</option>
            <option value="planned">Planifiées</option>
            <option value="delivered">Remises</option>
            <option value="cancelled">Annulées</option>
          </Select>
          <Select value={f.category} onChange={set("category")} aria-label="Type">
            <option value="">Tous les types</option>
            {catalogs?.assistance_categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select value={f.provider} onChange={set("provider")} aria-label="Structure">
            <option value="">Toutes les structures</option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.acronym || p.name}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Select value={f.operation} onChange={set("operation")} aria-label="Opération">
              <option value="">Toutes les opérations</option>
              {operations?.results.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {isLoading || !organizationId ? (
          <Spinner />
        ) : (
          <>
            <AidList
              aids={data?.results}
              showPerson
              onChanged={() => {
                mutate();
                mutateSummary();
              }}
              emptyText="Aucune aide ne correspond à ces filtres."
            />
            {data && data.count > 25 && (
              <div className="flex items-center justify-end gap-2 px-4 py-3 text-sm text-muted">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md px-2 py-1 hover:bg-navy-50 disabled:opacity-40">
                  Précédent
                </button>
                {page} / {pages}
                <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md px-2 py-1 hover:bg-navy-50 disabled:opacity-40">
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
