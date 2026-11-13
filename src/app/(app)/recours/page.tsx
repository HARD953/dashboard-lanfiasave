"use client";

import { Scale } from "lucide-react";
import { useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Spinner, Textarea } from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { STATUS_TONE, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Appeal } from "@/lib/types";

export default function AppealsPage() {
  const { organizationId, can } = useSession();
  const { data, isLoading, mutate } = useApi<Paginated<Appeal>>(organizationId ? `appeals/?organization=${organizationId}` : null);
  const [target, setTarget] = useState<{ appeal: Appeal; upheld: boolean } | null>(null);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function resolve() {
    if (!target) return;
    setBusy(true);
    try {
      await api(`appeals/${target.appeal.id}/resolve/`, { method: "POST", json: { upheld: target.upheld, resolution } });
      setTarget(null);
      setResolution("");
      await mutate();
      setFeedback({
        tone: "success",
        text: target.upheld ? "Recours accueilli : la candidature retourne au comité." : "Recours rejeté. La personne est informée.",
      });
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Action impossible." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Recours"
        subtitle="Délai de réponse : 30 jours. Un recours est examiné par une autre personne que l'auteur de la décision."
      />
      {feedback && (
        <div className="mb-4">
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </div>
      )}
      {isLoading || !organizationId ? (
        <Spinner />
      ) : !data?.results.length ? (
        <Card>
          <EmptyState icon={<Scale className="size-6" />} title="Aucun recours">
            Les recours déposés par les agents ou depuis l&apos;application Mon Parcours apparaîtront ici.
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.results.map((a) => {
            const open = ["open", "under_review"].includes(a.status);
            const late = open && isPast(a.due_date);
            return (
              <Card key={a.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{a.person_name}</p>
                    <p className="text-xs text-muted">
                      Déposé le {formatDate(a.created_at)} {a.filed_via === "beneficiary_app" ? "depuis l'application bénéficiaire" : `par ${a.filed_by_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {late && <Badge tone="danger">Délai dépassé</Badge>}
                    {open && <span className="text-xs text-muted">Échéance {formatDate(a.due_date)}</span>}
                    <Badge tone={STATUS_TONE[a.status]}>{a.status_label}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm">« {a.motive} »</p>
                {a.resolution && (
                  <p className="mt-3 rounded-lg bg-navy-50 p-3 text-sm">
                    <span className="font-semibold">Réponse : </span>
                    {a.resolution}
                  </p>
                )}
                {open && can("appeal.resolve") && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="accent" onClick={() => setTarget({ appeal: a, upheld: true })}>
                      Accueillir (réexamen)
                    </Button>
                    <Button variant="secondary" onClick={() => setTarget({ appeal: a, upheld: false })}>
                      Rejeter
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target?.upheld ? "Accueillir le recours" : "Rejeter le recours"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <Button loading={busy} disabled={resolution.trim().length < 10} onClick={resolve}>
              Confirmer
            </Button>
          </>
        }
      >
        <Field label="Réponse motivée" hint="Elle sera communiquée à la personne." required>
          <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}

/** Calculé uniquement au rendu des données (jamais au prérendu). */
function isPast(isoDate: string) {
  return isoDate < new Date().toISOString().slice(0, 10);
}
