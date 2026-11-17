"use client";

import { AlarmClock, Inbox, Plus, Scale, Search, Siren } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CLAIM_TONE, ClaimFormModal, useClaimsMeta, type Claim } from "@/components/claims";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Spinner, Stat, Table, Td, Th } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";

export default function ClaimsPage() {
  const router = useRouter();
  const { organizationId, can } = useSession();
  const { data: meta } = useClaimsMeta();
  const [f, setF] = useState({ view: "open", sector: "", status: "", channel: "", q: "" });
  const [creating, setCreating] = useState(false);
  const params = new URLSearchParams();
  if (organizationId) params.set("organization", organizationId);
  for (const k of ["sector", "status", "channel"] as const) if (f[k]) params.set(k, f[k]);
  if (f.q) params.set("search", f.q);
  if (f.view === "open") params.set("open", "true");
  if (f.view === "overdue") params.set("overdue", "true");
  if (f.view === "urgent") params.set("urgent", "true");
  if (f.view === "appeal") params.set("appeal", "open");
  if (f.view === "closed") params.set("status", "closed");
  const { data, mutate, isLoading } = useApi<Paginated<Claim>>(organizationId ? `claims/?${params}` : null);
  const all = useApi<Paginated<Claim>>(organizationId ? `claims/?organization=${organizationId}&open=true` : null).data;
  const overdue = useApi<Paginated<Claim>>(organizationId ? `claims/?organization=${organizationId}&overdue=true` : null).data;
  const urgent = useApi<Paginated<Claim>>(organizationId ? `claims/?organization=${organizationId}&open=true&urgent=true` : null).data;
  const appeals = useApi<Paginated<Claim>>(organizationId ? `claims/?organization=${organizationId}&appeal=open` : null).data;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const operatorView = !can("claim.view") && can("claim.operator");

  return (
    <>
      <PageHeader
        title={operatorView ? "Réclamations transmises" : "Demandes des ménages affectés"}
        subtitle={
          operatorView
            ? "Réclamations que la cellule locale vous a transmises. Les coordonnées n'apparaissent qu'avec l'accord du ménage."
            : "Mines, pétrole, énergie : chaque demande reçoit un numéro de dossier, une décision motivée en 30 jours au plus, et peut être contestée."
        }
        actions={can("claim.create") && <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouvelle demande</Button>}
      />
      {!operatorView && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="En cours" value={formatNumber(all?.count)} icon={<Inbox className="size-5" />} />
          <Stat label="En retard" value={formatNumber(overdue?.count)} hint="échéance de l'étape dépassée" accent="danger" icon={<AlarmClock className="size-5" />} />
          <Stat label="Urgences ouvertes" value={formatNumber(urgent?.count)} hint="mesure sous 72 h" accent="gold" icon={<Siren className="size-5" />} />
          <Stat label="Contestations en cours" value={formatNumber(appeals?.count)} hint="réponse sous 15 jours" accent="teal" icon={<Scale className="size-5" />} />
        </div>
      )}
      <Card>
        <div className="grid gap-3 border-b border-line p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
            <Input className="pl-9" placeholder="N° de dossier, nom, village…" value={f.q} onChange={set("q")} />
          </div>
          <Select value={f.view} onChange={set("view")} aria-label="Vue">
            <option value="open">En cours (par priorité)</option>
            <option value="overdue">En retard</option>
            <option value="urgent">Urgences</option>
            <option value="appeal">Contestées</option>
            <option value="closed">Clôturées</option>
            <option value="all">Toutes</option>
          </Select>
          <Select value={f.sector} onChange={set("sector")} aria-label="Secteur">
            <option value="">Tous secteurs</option>
            {meta?.sectors.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={f.channel} onChange={set("channel")} aria-label="Canal">
            <option value="">Tous canaux</option>
            {meta?.channels.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {isLoading || !organizationId ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<Inbox className="size-5" />} title="Aucune demande dans cette vue" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Dossier</Th>
                <Th>Ménage</Th>
                <Th>Impact</Th>
                {!operatorView && <Th>Priorité</Th>}
                <Th>Échéance</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-navy-50" onClick={() => router.push(`/demandes/${c.id}`)}>
                  <Td className="font-mono text-xs">
                    {c.reference}
                    {c.urgent && <span className="ml-2"><Badge tone="danger">Urgence</Badge></span>}
                  </Td>
                  <Td>
                    <span className="block font-medium text-ink">{c.claimant_name}</span>
                    <span className="text-xs text-muted">{[...new Set([c.village, c.territory_name].filter(Boolean))].join(" · ") || "—"}{c.channel_label ? ` · ${c.channel_label}` : ""}</span>
                  </Td>
                  <Td className="max-w-72 text-sm">
                    <span className="block text-xs text-muted">{c.sector_label}</span>
                    {c.impact_labels.slice(0, 2).join(", ")}
                    {c.impact_labels.length > 2 && ` +${c.impact_labels.length - 2}`}
                  </Td>
                  {!operatorView && (
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-navy-50">
                          <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${c.effective_priority}%` }} />
                        </div>
                        <span className="tabular text-xs">{c.effective_priority}</span>
                      </div>
                    </Td>
                  )}
                  <Td>
                    <span className={c.is_overdue ? "font-semibold text-danger" : "text-sm"}>{formatDate(c.deadlines?.current)}</span>
                  </Td>
                  <Td><Badge tone={CLAIM_TONE[c.status]}>{c.status_label}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">
        La priorité ordonne l&apos;examen et signale les urgences ; elle ne décide jamais de l&apos;éligibilité ni du montant. Aucun droit,
        indemnisation ou recours n&apos;est subordonné à l&apos;inscription dans l&apos;outil ; un dossier papier est toujours accepté.
      </p>
      <ClaimFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(c) => {
          setCreating(false);
          mutate();
          router.push(`/demandes/${c.id}?recu=1`);
        }}
      />
    </>
  );
}
