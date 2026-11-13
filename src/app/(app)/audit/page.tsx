"use client";

import { ScrollText } from "lucide-react";
import { useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Select, Spinner, Table, Td, Th } from "@/components/ui";
import { useApi, type Paginated } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";

type Event = {
  id: string;
  occurred_at: string;
  actor_name: string;
  action: string;
  outcome: "success" | "denied" | "error";
  object_type: string;
  object_id: string;
  reason: string;
  ip_address: string | null;
};

const ACTIONS: Record<string, string> = {
  "person.created": "Dossier créé",
  "person.updated": "Dossier modifié",
  "person.status_changed": "Statut de dossier",
  "person.merged": "Fusion de dossiers",
  "person.unmerged": "Fusion annulée",
  "survey.submitted": "Enquête saisie",
  "collect.submission": "Synchronisation terrain",
  "score.computed": "Score calculé",
  "program.created": "Programme créé",
  "program.status_changed": "Statut de programme",
  "program.rule_published": "Règle publiée",
  "application.created": "Candidature déposée",
  "application.status_changed": "Instruction",
  "decision.recorded": "Décision",
  "appeal.filed": "Recours déposé",
  "appeal.resolved": "Recours traité",
  "beneficiary.access_granted": "Accès bénéficiaire",
  "access.denied": "Accès refusé",
};

export default function AuditPage() {
  const { organizationId } = useSession();
  const [outcome, setOutcome] = useState("");
  const params = new URLSearchParams();
  if (outcome) params.set("outcome", outcome);
  const { data, isLoading } = useApi<Paginated<Event>>(organizationId ? `audit-events/?organization=${organizationId}&${params}` : null);

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        subtitle="Journal en ajout seul : aucune entrée ne peut être modifiée ni supprimée."
        actions={
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-48" aria-label="Résultat">
            <option value="">Tous les résultats</option>
            <option value="success">Succès</option>
            <option value="denied">Refus d&apos;accès</option>
          </Select>
        }
      />
      <Card>
        {isLoading || !organizationId ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<ScrollText className="size-6" />} title="Aucun événement" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Utilisateur</Th>
                <Th>Action</Th>
                <Th>Objet</Th>
                <Th>Motif</Th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap text-muted">{formatDate(e.occurred_at, true)}</Td>
                  <Td>{e.actor_name}</Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      {ACTIONS[e.action] ?? e.action}
                      {e.outcome !== "success" && <Badge tone="danger">Refusé</Badge>}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs text-muted">
                    {e.object_type.split(".").pop()} {e.object_id.slice(0, 8)}
                  </Td>
                  <Td className="max-w-xs truncate text-muted">{e.reason || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
