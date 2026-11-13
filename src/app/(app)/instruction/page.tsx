"use client";

import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Spinner, Table, Td, Th } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { APPLICATION_STATUS, BANDS, STATUS_TONE, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Application } from "@/lib/types";

const TABS = [
  { key: "", label: "Toutes" },
  { key: "submitted", label: "Déposées" },
  { key: "on_hold", label: "En attente" },
  { key: "admissible", label: "Recevables" },
  { key: "under_review", label: "Avis social" },
  { key: "committee", label: "Au comité" },
  { key: "decided", label: "Décidées" },
];

export default function InstructionPage() {
  const { organizationId } = useSession();
  const [tab, setTab] = useState("committee");
  const params = new URLSearchParams();
  if (organizationId) params.set("organization", organizationId);
  if (tab) params.set("status", tab);
  const { data, isLoading } = useApi<Paginated<Application>>(organizationId ? `applications/?${params}` : null);

  return (
    <>
      <PageHeader
        title="Instruction & comité"
        subtitle="Candidature → recevabilité → avis social → comité → décision motivée. Aucun refus n'est automatique."
      />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-navy-900 text-white" : "text-muted hover:bg-navy-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card>
        {isLoading || !organizationId ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<ClipboardCheck className="size-6" />} title="Aucune candidature">
            {tab ? `Aucune candidature au statut « ${APPLICATION_STATUS[tab]} ».` : "Aucune candidature."}
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Personne</Th>
                <Th>Programme</Th>
                <Th>Score consultatif</Th>
                <Th>Statut</Th>
                <Th>Décision</Th>
                <Th>Mise à jour</Th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((a) => (
                <tr key={a.id} className="hover:bg-navy-50/50">
                  <Td>
                    <Link href={`/instruction/${a.id}`} className="font-semibold text-navy-900 hover:text-teal-700">
                      {a.person_name}
                    </Link>
                    <p className="font-mono text-xs text-muted">{a.person_code}</p>
                  </Td>
                  <Td>{a.program_name}</Td>
                  <Td>
                    {a.score_summary ? (
                      <span className="flex items-center gap-2">
                        <Badge tone={BANDS[a.score_summary.band]?.tone}>{BANDS[a.score_summary.band]?.label}</Badge>
                        <span className="tabular text-xs text-muted">{a.score_summary.total}/100</span>
                      </span>
                    ) : (
                      <span className="text-xs text-soft">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[a.status]}>{a.status_label}</Badge>
                  </Td>
                  <Td>
                    {a.current_decision ? (
                      <Badge tone={STATUS_TONE[a.current_decision.outcome]}>{a.current_decision.outcome_label}</Badge>
                    ) : (
                      <span className="text-xs text-soft">—</span>
                    )}
                  </Td>
                  <Td className="text-muted">{formatDate(a.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
