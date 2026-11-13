"use client";

import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { STATUS_TONE, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Program } from "@/lib/types";

export default function ProgramsPage() {
  const { organizationId, can } = useSession();
  const { data, isLoading } = useApi<Paginated<Program>>(organizationId ? `programs/?organization=${organizationId}` : null);

  return (
    <>
      <PageHeader
        title="Programmes"
        subtitle="Les aides d'un programme ne peuvent jamais être utilisées dans un autre."
        actions={
          can("program.manage") && (
            <ButtonLink href="/programmes/nouveau" variant="accent" icon={<Plus className="size-4" />}>
              Nouveau programme
            </ButtonLink>
          )
        }
      />
      {isLoading || !organizationId ? (
        <Spinner />
      ) : !data?.results.length ? (
        <Card>
          <EmptyState icon={<FolderKanban className="size-6" />} title="Aucun programme">
            Créez un premier programme pour ouvrir les candidatures.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.results.map((p) => (
            <Link key={p.id} href={`/programmes/${p.id}`} className="group">
              <Card className="h-full p-5 transition group-hover:border-teal-500 group-hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{p.sector_label}</p>
                    <h2 className="mt-1 font-semibold text-navy-900 group-hover:text-teal-700">{p.name}</h2>
                  </div>
                  <Badge tone={STATUS_TONE[p.status]}>{p.status_label}</Badge>
                </div>
                {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>}
                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Candidatures</dt>
                    <dd className="tabular font-semibold">{formatNumber(p.applications_count)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Budget</dt>
                    <dd className="tabular font-semibold">{formatMoney(p.budget_amount, p.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Période</dt>
                    <dd className="font-semibold">{p.start_date ? formatDate(p.start_date) : "—"}</dd>
                  </div>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
