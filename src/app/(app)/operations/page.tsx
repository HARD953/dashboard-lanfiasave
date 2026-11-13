"use client";

import { Plus, Siren } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OperationFormModal } from "@/components/operation-form";
import { Badge, Button, Card, EmptyState, PageHeader, Select, Spinner } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { STATUS_TONE, formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Catalogs, Operation } from "@/lib/types";

export default function OperationsPage() {
  const { organizationId, can } = useSession();
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const params = new URLSearchParams();
  if (organizationId) params.set("organization", organizationId);
  if (kind) params.set("kind", kind);
  if (status) params.set("status", status);
  const { data, isLoading } = useApi<Paginated<Operation>>(organizationId ? `operations/?${params}` : null);
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Opérations & sinistres"
        subtitle="Déguerpissements, inondations, éboulements, sites miniers… Chaque personne touchée a un dossier suivi jusqu'à sa réinstallation."
        actions={
          can("operation.manage") && (
            <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              Nouvelle opération
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="w-72" aria-label="Type">
          <option value="">Tous les types</option>
          {catalogs?.operation_kinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-56" aria-label="Statut">
          <option value="">Tous les statuts</option>
          {catalogs?.operation_statuses.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </div>
      {isLoading || !organizationId ? (
        <Spinner />
      ) : !data?.results.length ? (
        <Card>
          <EmptyState icon={<Siren className="size-6" />} title="Aucune opération">
            Ouvrez une opération dès l&apos;annonce d&apos;un déguerpissement ou la survenue d&apos;un sinistre pour recenser les
            personnes touchées.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.results.map((o) => (
            <Link key={o.id} href={`/operations/${o.id}`} className="group">
              <Card className="h-full p-5 transition group-hover:border-teal-500 group-hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{o.kind_label}</p>
                    <h2 className="mt-1 font-semibold text-navy-900 group-hover:text-teal-700">{o.title}</h2>
                    <p className="mt-0.5 font-mono text-xs text-muted">{o.code}</p>
                  </div>
                  <Badge tone={STATUS_TONE[o.status]}>{o.status_label}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Personnes suivies</dt>
                    <dd className="tabular text-lg font-bold text-navy-900">{formatNumber(o.persons_count)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Déclenchée par</dt>
                    <dd className="truncate font-medium">{o.initiated_by_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Début</dt>
                    <dd className="font-medium">{formatDate(o.start_date)}</dd>
                  </div>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <OperationFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
