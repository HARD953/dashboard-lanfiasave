"use client";

import { Gavel, History, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { APPLICATION_STATUS, APPLICATION_TRANSITIONS, BANDS, STATUS_TONE, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Application } from "@/lib/types";

const NEEDS_REASON = new Set(["inadmissible", "on_hold", "withdrawn"]);

export default function ApplicationDetailPage({ id }: { id: string }) {
  const { can, me } = useSession();
  const { data: app, mutate, error } = useApi<Application>(`applications/${id}/`);
  const [draft, setDraft] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [decideOpen, setDecideOpen] = useState(false);

  if (error) return <Alert tone="danger">{error.status === 404 ? "Candidature introuvable ou hors de votre périmètre." : error.message}</Alert>;
  if (!app) return <Spinner />;

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    setFeedback(null);
    try {
      await fn();
      await mutate();
      setFeedback({ tone: "success", text: ok });
      return true;
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Action impossible." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  const opinion = draft ?? app.social_opinion;
  const transitions = can("application.review") ? APPLICATION_TRANSITIONS[app.status] ?? [] : [];
  const d = app.current_decision;

  return (
    <>
      <PageHeader
        back={{ href: "/instruction", label: "Instruction & comité" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {app.person_name} <Badge tone={STATUS_TONE[app.status]}>{app.status_label}</Badge>
          </span>
        }
        subtitle={
          <>
            {app.program_name} ·{" "}
            <Link href={`/beneficiaires/${app.person}`} className="font-mono text-teal-700 hover:underline">
              {app.person_code}
            </Link>
          </>
        }
        actions={
          <>
            {transitions.map((t) => (
              <Button
                key={t}
                variant={NEEDS_REASON.has(t) ? "secondary" : "primary"}
                loading={busy === t}
                onClick={() => {
                  if (NEEDS_REASON.has(t)) {
                    setReason("");
                    setPending(t);
                  } else {
                    run(t, () => api(`applications/${id}/transition/`, { method: "POST", json: { to: t } }), "Statut mis à jour.");
                  }
                }}
              >
                {t === "committee" ? "Transmettre au comité" : t === "under_review" && app.status === "committee" ? "Renvoyer à l'instruction" : APPLICATION_STATUS[t]}
              </Button>
            ))}
            {app.status === "committee" && can("decision.create") && (
              <Button variant="accent" icon={<Gavel className="size-4" />} onClick={() => setDecideOpen(true)}>
                Enregistrer la décision
              </Button>
            )}
          </>
        }
      />
      {feedback && (
        <div className="mb-4">
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </div>
      )}
      {app.status_reason && ["inadmissible", "on_hold"].includes(app.status) && (
        <div className="mb-4">
          <Alert tone="warning" title="Motif communiqué">
            {app.status_reason}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {d && (
            <Card className={d.outcome === "approved" ? "border-success/40" : d.outcome === "rejected" ? "border-danger/30" : ""}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    Décision du comité <Badge tone={STATUS_TONE[d.outcome]}>{d.outcome_label}</Badge>
                  </span>
                }
                subtitle={`${d.decided_by_name} · ${formatDate(d.created_at, true)}${d.supersedes ? " · remplace une décision antérieure" : ""}`}
              />
              <div className="space-y-3 p-5 text-sm">
                <p>
                  <span className="font-semibold">Motif communiqué : </span>
                  {d.motive}
                </p>
                {d.internal_notes && (
                  <p className="rounded-lg bg-navy-50 p-3 text-muted">
                    <span className="font-semibold text-ink">Notes internes (non communiquées) : </span>
                    {d.internal_notes}
                  </p>
                )}
                {d.committee_members.length > 0 && <p className="text-muted">Membres présents : {d.committee_members.join(", ")}</p>}
                {d.score_snapshot && (
                  <p className="text-xs text-muted">
                    Score consultatif au moment de la décision : {d.score_snapshot.total}/100 ({d.score_snapshot.version})
                  </p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Avis social" subtitle="Appréciation professionnelle du travailleur social." />
            <div className="space-y-3 p-5">
              <Textarea
                value={opinion}
                onChange={(e) => setDraft(e.target.value)}
                disabled={!can("application.review") || app.status === "decided"}
                placeholder="Situation observée, besoins prioritaires, recommandations…"
                className="min-h-36"
              />
              {can("application.review") && app.status !== "decided" && (
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    icon={<Save className="size-4" />}
                    loading={busy === "opinion"}
                    disabled={opinion === app.social_opinion}
                    onClick={() =>
                      run("opinion", () => api(`applications/${id}/`, { method: "PATCH", json: { social_opinion: opinion } }), "Avis enregistré.").then(
                        (ok) => ok && setDraft(null),
                      )
                    }
                  >
                    Enregistrer l&apos;avis
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Score consultatif" />
            <div className="p-5">
              {app.score_summary ? (
                <>
                  <p className="tabular text-3xl font-bold text-navy-900">
                    {app.score_summary.total}
                    <span className="text-base text-soft">/100</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={BANDS[app.score_summary.band]?.tone}>{BANDS[app.score_summary.band]?.label}</Badge>
                    {!app.score_summary.is_reliable && <Badge tone="warning">Peu fiable</Badge>}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Aide à l&apos;appréciation uniquement. Il ne déclenche ni refus ni versement.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">Aucun score rattaché à cette candidature.</p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><History className="size-4" /> Historique</span>} />
            <ol className="relative space-y-4 p-5">
              <li className="text-sm">
                <p className="font-medium">Candidature déposée</p>
                <p className="text-xs text-muted">{formatDate(app.created_at, true)}</p>
              </li>
              {app.history.map((h, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium">
                    {APPLICATION_STATUS[h.from_status] ?? h.from_status} → {APPLICATION_STATUS[h.to_status] ?? h.to_status}
                  </p>
                  <p className="text-xs text-muted">
                    {h.actor_name} · {formatDate(h.created_at, true)}
                  </p>
                  {h.reason && <p className="mt-0.5 text-xs">{h.reason}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending ? APPLICATION_STATUS[pending] : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Annuler
            </Button>
            <Button
              disabled={reason.trim().length < 5}
              loading={busy === pending}
              onClick={async () => {
                const ok = await run(pending!, () => api(`applications/${id}/transition/`, { method: "POST", json: { to: pending, reason } }), "Statut mis à jour.");
                if (ok) setPending(null);
              }}
            >
              Confirmer
            </Button>
          </>
        }
      >
        <Field label="Motif" hint="Formulé de manière compréhensible : il sera communiqué à la personne." required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>

      <DecisionModal
        open={decideOpen}
        onClose={() => setDecideOpen(false)}
        defaultMember={me?.full_name ?? ""}
        onSubmit={async (payload) => {
          const ok = await run("decide", () => api(`applications/${id}/decide/`, { method: "POST", json: payload }), "Décision enregistrée et notifiée.");
          if (ok) setDecideOpen(false);
        }}
        busy={busy === "decide"}
      />
    </>
  );
}

function DecisionModal({
  open,
  onClose,
  onSubmit,
  busy,
  defaultMember,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (p: Record<string, unknown>) => void;
  busy: boolean;
  defaultMember: string;
}) {
  const [outcome, setOutcome] = useState("approved");
  const [motive, setMotive] = useState("");
  const [notes, setNotes] = useState("");
  const [members, setMembers] = useState(defaultMember);
  const [quorum, setQuorum] = useState(true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Décision du comité"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="accent"
            loading={busy}
            disabled={motive.trim().length < 10}
            onClick={() =>
              onSubmit({
                outcome,
                motive,
                internal_notes: notes,
                quorum_met: quorum,
                committee_members: members.split(",").map((m) => m.trim()).filter(Boolean),
              })
            }
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <Alert tone="info">Une décision enregistrée est définitive. Une révision passera par un recours et une nouvelle décision.</Alert>
      <Field label="Décision" required>
        <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="approved">Accorder</option>
          <option value="rejected">Refuser</option>
          <option value="deferred">Ajourner</option>
        </Select>
      </Field>
      <Field label="Motif communiqué à la personne" hint="Phrases simples, sans information confidentielle." required>
        <Textarea value={motive} onChange={(e) => setMotive(e.target.value)} />
      </Field>
      <Field label="Notes internes (non communiquées)">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
      </Field>
      <Field label="Membres présents" hint="Séparés par des virgules">
        <input
          className="block h-10 w-full rounded-lg border border-line px-3 text-sm"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-teal-600" checked={quorum} onChange={(e) => setQuorum(e.target.checked)} />
        Le quorum est atteint
      </label>
    </Modal>
  );
}
