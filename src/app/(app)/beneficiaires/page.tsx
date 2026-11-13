"use client";

import { Search, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Spinner, Table, Td, Th } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { BANDS, SEX, STATUS_TONE, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Person } from "@/lib/types";

export default function PersonsPage() {
  const { organizationId, can } = useSession();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ page: String(page) });
  if (organizationId) params.set("organization", organizationId);
  if (debounced) params.set("q", debounced);
  if (status) params.set("status", status);
  const { data, isLoading } = useApi<Paginated<Person>>(organizationId ? `persons/?${params}` : null);
  const pages = data ? Math.max(1, Math.ceil(data.count / 25)) : 1;

  return (
    <>
      <PageHeader
        title="Bénéficiaires"
        subtitle="Dossiers personnes et ménages de votre organisation."
        actions={
          can("person.create") && (
            <ButtonLink href="/beneficiaires/nouveau" variant="accent" icon={<UserPlus className="size-4" />}>
              Nouveau dossier
            </ButtonLink>
          )
        }
      />
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
            <Input
              placeholder="Nom, code dossier (LFS-…) ou téléphone"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Rechercher"
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-52" aria-label="Statut">
            <option value="">Tous les statuts</option>
            <option value="submitted">Soumis</option>
            <option value="quality_check">Contrôle qualité</option>
            <option value="to_correct">À corriger</option>
            <option value="verified">Vérifié</option>
            <option value="active">Actif</option>
            <option value="archived">Archivé</option>
          </Select>
        </div>
        {isLoading || !organizationId ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<Users className="size-6" />} title="Aucun dossier trouvé">
            Modifiez la recherche ou créez un nouveau dossier.
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Personne</Th>
                  <Th>Code dossier</Th>
                  <Th>Territoire</Th>
                  <Th>Vulnérabilité</Th>
                  <Th>Statut</Th>
                  <Th>Créé le</Th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-50/50">
                    <Td>
                      <Link href={`/beneficiaires/${p.id}`} className="font-semibold text-navy-900 hover:text-teal-700">
                        {p.display_name}
                      </Link>
                      <p className="text-xs text-muted">
                        {SEX[p.sex]}
                        {p.age !== null && ` · ${p.age} ans`}
                        {p.is_provisional && " · identité provisoire"}
                      </p>
                    </Td>
                    <Td className="font-mono text-xs">{p.public_code}</Td>
                    <Td>{p.territory_name ?? "—"}</Td>
                    <Td>
                      {p.latest_score ? (
                        <span className="flex items-center gap-2">
                          <Badge tone={BANDS[p.latest_score.band]?.tone}>{BANDS[p.latest_score.band]?.label}</Badge>
                          <span className="tabular text-xs text-muted">{p.latest_score.total}/100</span>
                        </span>
                      ) : (
                        <span className="text-xs text-soft">Non évalué</span>
                      )}
                    </Td>
                    <Td>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={STATUS_TONE[p.status]}>{p.status_label}</Badge>
                        {p.open_duplicates > 0 && <Badge tone="warning">Doublon ?</Badge>}
                      </span>
                    </Td>
                    <Td className="text-muted">{formatDate(p.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
              <span>{data.count} dossier(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md px-2 py-1 hover:bg-navy-50 disabled:opacity-40">
                  Précédent
                </button>
                <span>
                  {page} / {pages}
                </span>
                <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md px-2 py-1 hover:bg-navy-50 disabled:opacity-40">
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
