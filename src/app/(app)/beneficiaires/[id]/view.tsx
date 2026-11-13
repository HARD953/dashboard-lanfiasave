"use client";

import { Calculator, FileText, KeyRound, Link2, Send, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  DefinitionList,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { BANDS, SEX, STATUS_TONE, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import { AidPanel, OperationCasesPanel, VulnerabilityPanel } from "@/components/person-panels";
import type { Application, Person, Program, Questionnaire, ScoreResult, SurveyResponse } from "@/lib/types";

const RECORD_ACTIONS: Record<string, { to: string; label: string; perm: string }[]> = {
  draft: [{ to: "submitted", label: "Soumettre", perm: "person.update" }],
  submitted: [{ to: "quality_check", label: "Envoyer au contrôle qualité", perm: "person.update" }],
  quality_check: [
    { to: "verified", label: "Valider le dossier", perm: "person.verify" },
    { to: "to_correct", label: "Demander une correction", perm: "person.verify" },
  ],
  to_correct: [{ to: "submitted", label: "Soumettre à nouveau", perm: "person.update" }],
  verified: [{ to: "active", label: "Activer", perm: "person.update" }],
  active: [{ to: "archived", label: "Archiver", perm: "person.update" }],
  archived: [],
};

type Duplicate = {
  id: string;
  confidence: number;
  reasons: string[];
  status: string;
  other: { id: string; public_code: string; display_name: string; age: number | null };
};

export default function PersonDetailPage({ id }: { id: string }) {
  const { can } = useSession();
  const { data: person, mutate, error } = useApi<Person>(`persons/${id}/`);
  const { data: surveys, mutate: mutateSurveys } = useApi<Paginated<SurveyResponse>>(`survey-responses/?person=${id}`);
  const { data: scores, mutate: mutateScores } = useApi<Paginated<ScoreResult>>(
    can("score.view") ? `scores/?person=${id}` : null,
  );
  const { data: applications, mutate: mutateApps } = useApi<Paginated<Application>>(
    can("application.view") ? `applications/?person=${id}` : null,
  );
  const { data: duplicates, mutate: mutateDup } = useApi<Duplicate[]>(`persons/${id}/duplicates/`);
  const { data: questionnaires } = useApi<Questionnaire[]>("questionnaires/");

  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [access, setAccess] = useState<{ identifier: string; pin: string } | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<Duplicate | null>(null);

  if (error) return <Alert tone="danger">{error.status === 404 ? "Dossier introuvable ou hors de votre périmètre." : error.message}</Alert>;
  if (!person) return <Spinner />;

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    setFeedback(null);
    try {
      await fn();
      setFeedback({ tone: "success", text: success });
      await Promise.all([mutate(), mutateScores(), mutateApps(), mutateDup(), mutateSurveys()]);
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Action impossible." });
    } finally {
      setBusy(null);
    }
  }

  const latestScore = scores?.results[0];
  const latestSurvey = surveys?.results[0];
  const questionnaire = questionnaires?.find((q) => q.id === latestSurvey?.questionnaire);
  const openDup = duplicates?.filter((d) => d.status === "open") ?? [];

  return (
    <>
      <PageHeader
        back={{ href: "/beneficiaires", label: "Bénéficiaires" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {person.display_name}
            <Badge tone={STATUS_TONE[person.status]}>{person.status_label}</Badge>
            {person.is_provisional && <Badge tone="gold">Identité provisoire</Badge>}
            {person.enrollment_context === "emergency" && <Badge tone="danger">Urgence</Badge>}
          </span>
        }
        subtitle={<span className="font-mono">{person.public_code}</span>}
        actions={
          <>
            {RECORD_ACTIONS[person.status]
              ?.filter((a) => can(a.perm))
              .map((a) => (
                <Button
                  key={a.to}
                  variant={a.to === "to_correct" || a.to === "archived" ? "secondary" : "primary"}
                  loading={busy === a.to}
                  onClick={() =>
                    run(a.to, () => api(`persons/${id}/transition/`, { method: "POST", json: { to: a.to } }), "Statut mis à jour.")
                  }
                >
                  {a.label}
                </Button>
              ))}
          </>
        }
      />

      {feedback && (
        <div className="mb-4">
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </div>
      )}
      {person.merged_into && (
        <div className="mb-4">
          <Alert tone="warning" title="Dossier fusionné">
            Ce dossier a été rattaché à un autre dossier.{" "}
            <Link className="font-semibold underline" href={`/beneficiaires/${person.merged_into}`}>
              Ouvrir le dossier conservé
            </Link>
            {can("person.merge") && (
              <Button
                variant="ghost"
                className="ml-2 h-7"
                onClick={() =>
                  run("unmerge", () => api(`persons/${id}/unmerge/`, { method: "POST", json: { reason: "Annulation de fusion" } }), "Fusion annulée.")
                }
              >
                Annuler la fusion
              </Button>
            )}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Identité et situation" subtitle={person.masked ? "Certains champs sensibles sont masqués selon votre rôle." : undefined} />
            <div className="p-5">
              <DefinitionList
                items={[
                  { label: "Sexe", value: SEX[person.sex] },
                  { label: "Âge", value: person.age !== null ? `${person.age} ans${person.birth_date ? "" : " (estimé)"}` : "Inconnu" },
                  { label: "Téléphone", value: person.phone || "Aucun" },
                  { label: "Langue", value: person.language },
                  { label: "Commune", value: person.territory_name },
                  { label: "Pièce d'identité", value: person.has_identity_document ? "Oui" : "Non" },
                  { label: "N° couverture maladie", value: person.health_coverage_number || "—" },
                  { label: "Ménage", value: person.household ? <span className="font-mono">{person.household.code}</span> : "—" },
                ]}
              />
            </div>
          </Card>

          <VulnerabilityPanel personId={person.id} />
          <AidPanel personId={person.id} personName={person.display_name} />
          <Card>
            <CardHeader
              title="Évaluation de vulnérabilité"
              subtitle="Score consultatif à 7 dimensions — il ne vaut ni décision, ni refus, ni droit."
              action={
                latestSurvey &&
                can("score.compute") && (
                  <Button
                    variant="secondary"
                    icon={<Calculator className="size-4" />}
                    loading={busy === "score"}
                    onClick={() => run("score", () => api(`survey-responses/${latestSurvey.id}/score/`, { method: "POST" }), "Score recalculé.")}
                  >
                    Recalculer
                  </Button>
                )
              }
            />
            {!latestScore ? (
              <EmptyState icon={<Calculator className="size-6" />} title="Aucun score">
                {latestSurvey ? "Lancez le calcul à partir de la dernière enquête." : "Aucune enquête n'a encore été saisie pour cette personne."}
              </EmptyState>
            ) : (
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <p className="tabular text-4xl font-bold text-navy-900">
                    {latestScore.total}
                    <span className="text-lg font-medium text-soft">/100</span>
                  </p>
                  <Badge tone={BANDS[latestScore.band]?.tone}>Vulnérabilité {BANDS[latestScore.band]?.label.toLowerCase()}</Badge>
                  <span className="text-sm text-muted">
                    Complétude {Math.round(Number(latestScore.completeness) * 100)} % · {latestScore.scoring_version_label} ·{" "}
                    {formatDate(latestScore.created_at, true)}
                  </span>
                </div>
                {!latestScore.is_reliable && (
                  <div className="mt-4">
                    <Alert tone="warning" title="Score peu fiable">
                      Trop de réponses manquent : complétez l&apos;enquête avant de vous appuyer sur ce score.
                    </Alert>
                  </div>
                )}
                <div className="mt-5 space-y-3">
                  {latestScore.details.dimensions.map((d) => (
                    <details key={d.code} className="group rounded-lg border border-line px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center gap-3">
                        <span className="grid size-7 place-items-center rounded-md bg-navy-50 text-xs font-bold text-navy-800">{d.code}</span>
                        <span className="flex-1 text-sm font-medium">{d.label}</span>
                        <span className="w-32">
                          <span className="block h-1.5 rounded-full bg-navy-50">
                            <span className="block h-1.5 rounded-full bg-teal-600" style={{ width: `${(d.score / d.cap) * 100}%` }} />
                          </span>
                        </span>
                        <span className="tabular w-14 text-right text-sm font-semibold">
                          {d.score}/{d.cap}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                        {d.contributions.map((c) => (
                          <p key={c.question} className="flex justify-between text-muted">
                            <span>{labelOf(questionnaire, c.question)} : <b className="text-ink">{answerLabel(questionnaire, c.question, c.value)}</b></span>
                            <span className="tabular">+{c.points}</span>
                          </p>
                        ))}
                        {d.missing.map((m) => (
                          <p key={m.question} className="flex justify-between text-warning">
                            <span>{labelOf(questionnaire, m.question)}</span>
                            <span>{m.reason}</span>
                          </p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted">{latestScore.disclaimer}</p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Dernière enquête"
              subtitle={latestSurvey ? `${latestSurvey.questionnaire_label} · ${formatDate(latestSurvey.collected_at, true)} · ${latestSurvey.collected_by_name ?? ""}` : undefined}
            />
            {!latestSurvey || !questionnaire ? (
              <EmptyState icon={<FileText className="size-6" />} title="Aucune enquête">
                Les enquêtes sont saisies depuis l&apos;application LanfiaSave Collecte.
              </EmptyState>
            ) : (
              <div className="divide-y divide-line">
                {questionnaire.definition.sections.map((s) => {
                  const answered = s.questions.filter((q) => latestSurvey.answers[q.code] !== undefined);
                  if (!answered.length) return null;
                  return (
                    <div key={s.code} className="px-5 py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{s.title}</p>
                      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                        {answered.map((q) => (
                          <div key={q.code} className="flex justify-between gap-3">
                            <dt className="text-muted">{q.label}</dt>
                            <dd className="text-right font-medium">{answerLabel(questionnaire, q.code, latestSurvey.answers[q.code])}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <OperationCasesPanel personId={person.id} />
          {openDup.length > 0 && (
            <Card className="border-warning/40">
              <CardHeader title={<span className="flex items-center gap-2 text-warning"><ShieldAlert className="size-4" /> Doublons possibles</span>} />
              <ul className="divide-y divide-line">
                {openDup.map((d) => (
                  <li key={d.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <Link href={`/beneficiaires/${d.other.id}`} className="font-semibold text-navy-900 hover:underline">
                        {d.other.display_name}
                      </Link>
                      <Badge tone={d.confidence >= 80 ? "danger" : "warning"}>{d.confidence} %</Badge>
                    </div>
                    <p className="text-xs text-muted">{d.reasons.join(" · ")}</p>
                    {can("person.merge") && (
                      <Button variant="ghost" className="mt-1 h-8 px-2" icon={<Link2 className="size-3.5" />} onClick={() => setMergeTarget(d)}>
                        Fusionner dans ce dossier
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Candidatures"
              action={
                can("application.create") && (
                  <Button variant="secondary" className="h-8 px-3" icon={<Send className="size-3.5" />} onClick={() => setApplyOpen(true)}>
                    Inscrire
                  </Button>
                )
              }
            />
            {!applications?.results.length ? (
              <p className="px-5 py-6 text-sm text-muted">Aucune candidature à un programme.</p>
            ) : (
              <ul className="divide-y divide-line">
                {applications.results.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <Link href={`/instruction/${a.id}`} className="text-sm font-semibold text-navy-900 hover:underline">
                      {a.program_name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={STATUS_TONE[a.status]}>{a.status_label}</Badge>
                      {a.current_decision && (
                        <Badge tone={STATUS_TONE[a.current_decision.outcome]}>{a.current_decision.outcome_label}</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Espace « Mon Parcours »" subtitle="Accès du bénéficiaire à l'application mobile." />
            <div className="space-y-3 p-5 text-sm">
              {access ? (
                <Alert tone="success" title="Code PIN généré">
                  Code dossier : <b className="font-mono">{access.identifier}</b>
                  <br />
                  Code PIN : <b className="font-mono text-lg tracking-widest">{access.pin}</b>
                  <br />
                  <span className="text-xs">Remettez-le en main propre. Il ne sera plus affiché.</span>
                </Alert>
              ) : (
                <p className="text-muted">
                  {person.has_beneficiary_access ? "Un accès existe déjà. Vous pouvez générer un nouveau code PIN." : "Aucun accès n'a encore été créé."}
                </p>
              )}
              {can("person.update") && (
                <Button
                  variant="secondary"
                  className="w-full"
                  icon={<KeyRound className="size-4" />}
                  loading={busy === "access"}
                  onClick={() =>
                    run("access", async () => setAccess(await api(`persons/${id}/beneficiary-access/`, { method: "POST" })), "Accès créé.")
                  }
                >
                  {person.has_beneficiary_access ? "Réinitialiser le code PIN" : "Créer l'accès"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        person={person}
        scoreId={latestScore?.id}
        onDone={() => {
          setApplyOpen(false);
          mutateApps();
          setFeedback({ tone: "success", text: "Candidature déposée." });
        }}
      />

      <Modal
        open={!!mergeTarget}
        onClose={() => setMergeTarget(null)}
        title="Confirmer la fusion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMergeTarget(null)}>
              Annuler
            </Button>
            <Button
              loading={busy === "merge"}
              onClick={() =>
                mergeTarget &&
                run(
                  "merge",
                  () => api(`persons/${id}/merge/`, { method: "POST", json: { keep: mergeTarget.other.id, reason: "Doublon confirmé par superviseur" } }),
                  "Dossier fusionné. La fusion reste réversible.",
                ).then(() => setMergeTarget(null))
              }
            >
              Fusionner
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Ce dossier (<b>{person.public_code}</b>) sera rattaché à <b>{mergeTarget?.other.display_name}</b> (
          {mergeTarget?.other.public_code}). Rien n&apos;est supprimé et la fusion peut être annulée.
        </p>
      </Modal>
    </>
  );
}

function ApplyModal({
  open,
  onClose,
  person,
  scoreId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  person: Person;
  scoreId?: string;
  onDone: () => void;
}) {
  const { data: programs } = useApi<Paginated<Program>>(open ? `programs/?status=active` : null);
  const [program, setProgram] = useState("");
  const [opinion, setOpinion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const eligible = programs?.results.filter((p) => p.organization === person.organization) ?? [];

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await api("applications/", {
        method: "POST",
        json: { program, person: person.id, score: scoreId ?? null, social_opinion: opinion },
      });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Dépôt impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Inscrire à un programme"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="accent" disabled={!program} loading={saving} onClick={submit}>
            Déposer la candidature
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Programme" required>
        <Select value={program} onChange={(e) => setProgram(e.target.value)}>
          <option value="">— Choisir un programme actif —</option>
          {eligible.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Premier avis social" hint="Facultatif, peut être complété pendant l'instruction">
        <Textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} />
      </Field>
    </Modal>
  );
}

function labelOf(q: Questionnaire | undefined, code: string) {
  for (const s of q?.definition.sections ?? []) for (const qq of s.questions) if (qq.code === code) return qq.label;
  return code;
}

function answerLabel(q: Questionnaire | undefined, code: string, value: unknown) {
  if (typeof value === "string" && q?.definition.special_values?.[value]) return q.definition.special_values[value];
  for (const s of q?.definition.sections ?? [])
    for (const qq of s.questions)
      if (qq.code === code) return qq.options?.find((o) => o.value === value)?.label ?? String(value);
  return String(value);
}
