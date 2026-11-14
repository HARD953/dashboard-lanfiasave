"use client";

import { CalendarCheck, Footprints, Lock, Plus, Route } from "lucide-react";
import { useState } from "react";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { formatDate, type Tone } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Catalogs, Grievance, Partner, Person, Referral, Visit } from "@/lib/types";
import { Alert, Badge, Button, Card, CardHeader, DefinitionList, EmptyState, Field, Input, Modal, Select, Textarea } from "./ui";

export const FOLLOWUP_TONE: Record<string, Tone> = {
  received: "warning",
  acknowledged: "info",
  investigating: "info",
  escalated: "danger",
  resolved: "success",
  closed: "neutral",
  rejected: "neutral",
  sent: "warning",
  accepted: "info",
  completed: "success",
  refused: "danger",
  no_show: "danger",
  cancelled: "neutral",
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  improved: "success",
  stable: "info",
  worsened: "warning",
  critical: "danger",
};

function useErr() {
  const [error, setError] = useState<string | null>(null);
  const capture = (e: unknown, fallback = "Action impossible.") => setError(e instanceof ApiError ? e.readable : fallback);
  return { error, setError, capture };
}

/** Recherche d'une personne enregistrée (nom, code dossier, téléphone). */
export function PersonPicker({ value, onChange }: { value: Person | null; onChange: (p: Person | null) => void }) {
  const { organizationId } = useSession();
  const [q, setQ] = useState("");
  const { data } = useApi<Paginated<Person>>(
    organizationId && q.length >= 2 && !value ? `persons/?organization=${organizationId}&q=${encodeURIComponent(q)}` : null,
  );
  if (value)
    return (
      <div className="flex items-center justify-between rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-sm">
        <span>
          <b>{value.display_name}</b> <span className="font-mono text-xs text-muted">{value.public_code}</span>
        </span>
        <button type="button" className="text-xs font-semibold text-teal-700 hover:underline" onClick={() => onChange(null)}>
          Changer
        </button>
      </div>
    );
  return (
    <div className="space-y-2">
      <Input placeholder="Nom, code dossier ou téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.length >= 2 && (
        <ul className="max-h-44 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {(data?.results ?? []).map((p) => (
            <li key={p.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-navy-50" onClick={() => onChange(p)}>
                <b>{p.display_name}</b> <span className="font-mono text-xs text-muted">{p.public_code}</span>
                <span className="block text-xs text-muted">{p.territory_name ?? "—"}</span>
              </button>
            </li>
          ))}
          {data && !data.results.length && <li className="px-3 py-3 text-center text-sm text-muted">Aucun résultat.</li>}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Plaintes

export function GrievanceModal({ open, onClose, onSaved, person }: { open: boolean; onClose: () => void; onSaved: () => void; person?: Person }) {
  const { organizationId } = useSession();
  const { data: catalogs } = useApi<Catalogs>(open ? "catalogs/" : null);
  const { data: territories } = useApi<{ id: string; name: string; level: string }[]>(open ? "territories/" : null);
  const empty = { channel: "in_person", category: "payment_delay", priority: "normal", subject: "", description: "", anonymous: false, complainant_name: "", complainant_phone: "", territory: "" };
  const [f, setF] = useState(empty);
  const [who, setWho] = useState<Person | null>(person ?? null);
  const [busy, setBusy] = useState(false);
  const { error, setError, capture } = useErr();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("grievances/", {
        method: "POST",
        json: { ...f, organization: organizationId, person: f.anonymous ? null : who?.id ?? null, territory: f.territory || null },
      });
      setF(empty);
      setWho(person ?? null);
      onSaved();
    } catch (e) {
      capture(e, "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  const confidential = ["sea", "fraud", "staff_conduct"].includes(f.category);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enregistrer une plainte ou réclamation"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="accent" loading={busy} disabled={f.subject.length < 3 || f.description.length < 5} onClick={submit}>
            Enregistrer
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Catégorie" required>
          <Select value={f.category} onChange={set("category")}>
            {catalogs?.grievance_categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Reçue par" required>
          <Select value={f.channel} onChange={set("channel")}>
            {catalogs?.grievance_channels.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Priorité" hint="Délai cible : urgente 3 j · haute 10 j · normale 30 j">
          <Select value={f.priority} onChange={set("priority")}>
            {catalogs?.grievance_priorities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Localité">
          <Select value={f.territory} onChange={set("territory")}>
            <option value="">—</option>
            {territories?.filter((t) => t.level !== "country").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
      </div>
      {confidential && (
        <Alert tone="warning" title="Plainte confidentielle">
          Son contenu ne sera visible que des personnes habilitées aux données sensibles. Pour un cas d&apos;EAS, orientez sans délai vers une prise en charge VBG.
        </Alert>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-teal-600" checked={f.anonymous} onChange={(e) => setF({ ...f, anonymous: e.target.checked })} />
        Plainte anonyme (aucune identité enregistrée)
      </label>
      {!f.anonymous && (
        <>
          <Field label="Bénéficiaire concerné (facultatif)">
            <PersonPicker value={who} onChange={setWho} />
          </Field>
          {!who && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom du plaignant"><Input value={f.complainant_name} onChange={set("complainant_name")} /></Field>
              <Field label="Téléphone"><Input value={f.complainant_phone} onChange={set("complainant_phone")} /></Field>
            </div>
          )}
        </>
      )}
      <Field label="Objet" required><Input value={f.subject} onChange={set("subject")} maxLength={200} /></Field>
      <Field label="Description" required><Textarea rows={3} value={f.description} onChange={set("description")} /></Field>
    </Modal>
  );
}

export function GrievanceDrawer({ grievance, onClose, onChanged }: { grievance: Grievance | null; onClose: () => void; onChanged: () => void }) {
  const { can } = useSession();
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const { error, setError, capture } = useErr();
  if (!grievance) return null;
  const g = grievance;

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      await api(`grievances/${g.id}/transition/`, { method: "POST", json: { status: to, note, escalated_to: target } });
      setTo("");
      setNote("");
      setTarget("");
      onChanged();
    } catch (e) {
      capture(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Plainte ${g.reference}`}>
      <div className="flex flex-wrap gap-2">
        <Badge tone={FOLLOWUP_TONE[g.status]}>{g.status_label}</Badge>
        <Badge tone={FOLLOWUP_TONE[g.priority]}>Priorité {g.priority_label.toLowerCase()}</Badge>
        {g.is_overdue && <Badge tone="danger">Délai dépassé</Badge>}
        {g.is_confidential && <Badge tone="gold"><Lock className="size-3" /> Confidentielle</Badge>}
      </div>
      <p className="font-semibold text-ink">{g.subject}</p>
      <p className="whitespace-pre-line text-sm text-muted">{g.description}</p>
      <DefinitionList
        items={[
          { label: "Catégorie", value: g.category_label },
          { label: "Canal", value: g.channel_label },
          { label: "Plaignant", value: g.anonymous ? "Anonyme" : g.person_name ?? g.complainant_name },
          { label: "Échéance", value: formatDate(g.due_date) },
          { label: "Opération", value: g.operation_title },
          { label: "Localité", value: g.territory_name },
          ...(g.escalated_to ? [{ label: "Escaladée vers", value: g.escalated_to }] : []),
          ...(g.resolution ? [{ label: "Réponse apportée", value: g.resolution }] : []),
          ...(g.satisfaction
            ? [{ label: "Avis de la personne", value: { satisfied: "Satisfaite", partly: "Partiellement satisfaite", unsatisfied: "Non satisfaite" }[g.satisfaction] ?? g.satisfaction }]
            : []),
        ]}
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {can("grievance.manage") && g.allowed_transitions.length > 0 && (
        <div className="space-y-3 rounded-lg border border-line bg-canvas p-3">
          <Field label="Faire avancer la plainte">
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choisir…</option>
              {g.allowed_transitions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          {to === "escalated" && (
            <Field label="Instance saisie" required><Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Direction régionale, comité de plaintes, Médiateur…" /></Field>
          )}
          {to && (
            <Field label={["resolved", "rejected"].includes(to) ? "Réponse apportée au plaignant" : "Note"} required={["resolved", "rejected"].includes(to)}>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          )}
          <Button variant="accent" disabled={!to} loading={busy} onClick={apply}>Valider</Button>
        </div>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ Orientations

export function ReferralModal({ open, onClose, onSaved, person }: { open: boolean; onClose: () => void; onSaved: () => void; person?: Person }) {
  const { organizationId } = useSession();
  const { data: catalogs } = useApi<Catalogs>(open ? "catalogs/" : null);
  const { data: partners } = useApi<Partner[]>(open && organizationId ? `partners/?organization=${organizationId}&is_active=true` : null);
  const empty = { service: "civil_registry", partner: "", service_name: "", reason: "", urgent: false, appointment_date: "" };
  const [f, setF] = useState(empty);
  const [who, setWho] = useState<Person | null>(person ?? null);
  const [busy, setBusy] = useState(false);
  const { error, setError, capture } = useErr();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("referrals/", { method: "POST", json: { ...f, person: who?.id, partner: f.partner || null, appointment_date: f.appointment_date || null } });
      setF(empty);
      setWho(person ?? null);
      onSaved();
    } catch (e) {
      capture(e, "Orientation impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Orienter vers un service"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="accent" loading={busy} disabled={!who || f.reason.length < 5} onClick={submit}>Orienter</Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      {!person && (
        <Field label="Personne orientée" required>
          <PersonPicker value={who} onChange={setWho} />
        </Field>
      )}
      <Field label="Service" required>
        <Select value={f.service} onChange={set("service")}>
          {catalogs?.referral_services.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Structure partenaire">
          <Select value={f.partner} onChange={set("partner")}>
            <option value="">Autre (préciser)</option>
            {partners?.map((p) => <option key={p.id} value={p.id}>{p.acronym || p.name}</option>)}
          </Select>
        </Field>
        {!f.partner ? (
          <Field label="Nom de la structure" required><Input value={f.service_name} onChange={set("service_name")} /></Field>
        ) : (
          <Field label="Rendez-vous"><Input type="date" value={f.appointment_date} onChange={set("appointment_date")} /></Field>
        )}
      </div>
      <Field label="Motif de l'orientation" required><Textarea rows={2} value={f.reason} onChange={set("reason")} /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-teal-600" checked={f.urgent} onChange={(e) => setF({ ...f, urgent: e.target.checked })} />
        Orientation urgente
      </label>
    </Modal>
  );
}

export function ReferralUpdate({ referral, onClose, onChanged }: { referral: Referral | null; onClose: () => void; onChanged: () => void }) {
  const [to, setTo] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const { error, setError, capture } = useErr();
  if (!referral) return null;
  const r = referral;
  async function apply() {
    setBusy(true);
    setError(null);
    try {
      await api(`referrals/${r.id}/transition/`, { method: "POST", json: { status: to, feedback } });
      setTo("");
      setFeedback("");
      onChanged();
    } catch (e) {
      capture(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Orientation ${r.reference}`}
      footer={r.allowed_transitions.length > 0 && <Button variant="accent" disabled={!to} loading={busy} onClick={apply}>Enregistrer</Button>}
    >
      <DefinitionList
        items={[
          { label: "Personne", value: `${r.person_name} (${r.person_code})` },
          { label: "Service", value: r.service_label },
          { label: "Structure", value: r.partner_name },
          { label: "Rendez-vous", value: formatDate(r.appointment_date) },
          { label: "Motif", value: r.reason },
          { label: "Retour du service", value: r.feedback },
        ]}
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {r.allowed_transitions.length > 0 && (
        <>
          <Field label="Nouveau statut">
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choisir…</option>
              {r.allowed_transitions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Retour du service (contre-référence)" required={["completed", "refused"].includes(to)}>
            <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </Field>
        </>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ Visites

type VisitModalProps = { open: boolean; onClose: () => void; onSaved: () => void; person?: Person };

/** Le formulaire n'est monté qu'à l'ouverture : la date du jour est lue au clic, jamais au pré-rendu. */
export function VisitModal(props: VisitModalProps) {
  return props.open ? <VisitForm {...props} /> : null;
}

function VisitForm({ open, onClose, onSaved, person }: VisitModalProps) {
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const today = new Date().toISOString().slice(0, 10);
  const empty = { kind: "home", visited_at: today, person_present: true, trend: "stable", summary: "", next_visit_date: "" };
  const [f, setF] = useState(empty);
  const [who, setWho] = useState<Person | null>(person ?? null);
  const [busy, setBusy] = useState(false);
  const { error, setError, capture } = useErr();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("visits/", { method: "POST", json: { ...f, person: who?.id, next_visit_date: f.next_visit_date || null } });
      setF(empty);
      setWho(person ?? null);
      onSaved();
    } catch (e) {
      capture(e, "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compte rendu de visite"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="accent" loading={busy} disabled={!who || f.summary.length < 3} onClick={submit}>Enregistrer</Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      {!person && (
        <Field label="Personne suivie" required>
          <PersonPicker value={who} onChange={setWho} />
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type de contact">
          <Select value={f.kind} onChange={set("kind")}>
            {catalogs?.visit_kinds.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Date"><Input type="date" max={today} value={f.visited_at} onChange={set("visited_at")} /></Field>
        <Field label="Évolution de la situation">
          <Select value={f.trend} onChange={set("trend")}>
            {catalogs?.visit_trends.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Prochaine visite"><Input type="date" min={f.visited_at} value={f.next_visit_date} onChange={set("next_visit_date")} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-teal-600" checked={f.person_present} onChange={(e) => setF({ ...f, person_present: e.target.checked })} />
        La personne était présente
      </label>
      <Field label="Observations" hint="Faits constatés, sans jugement de valeur." required>
        <Textarea rows={3} value={f.summary} onChange={set("summary")} />
      </Field>
    </Modal>
  );
}

export function VisitList({ visits, showPerson }: { visits?: Visit[]; showPerson?: boolean }) {
  if (!visits?.length) return <EmptyState icon={<Footprints className="size-5" />} title="Aucune visite enregistrée" />;
  return (
    <ul className="divide-y divide-line">
      {visits.map((v) => (
        <li key={v.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <CalendarCheck className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {showPerson ? `${v.person_name} · ` : ""}
              {v.kind_label} — {formatDate(v.visited_at)}
            </p>
            <p className="text-sm text-muted">{v.summary}</p>
            <p className="mt-1 text-xs text-soft">
              {v.visited_by_name ?? "—"}
              {v.next_visit_date && ` · prochaine visite le ${formatDate(v.next_visit_date)}`}
              {!v.person_present && " · personne absente"}
            </p>
          </div>
          <Badge tone={FOLLOWUP_TONE[v.trend]}>{v.trend_label}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** Panneau « Suivi social » de la fiche bénéficiaire : visites et orientations. */
export function FollowupPanel({ person }: { person: Person }) {
  const { can } = useSession();
  const visits = useApi<Paginated<Visit>>(can("visit.view") ? `visits/?person=${person.id}` : null);
  const referrals = useApi<Paginated<Referral>>(can("referral.view") ? `referrals/?person=${person.id}` : null);
  const [modal, setModal] = useState<"visit" | "referral" | null>(null);
  const [current, setCurrent] = useState<Referral | null>(null);
  if (!can("visit.view") && !can("referral.view")) return null;
  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2"><Route className="size-4 text-teal-700" /> Suivi social</span>}
        subtitle="Visites, évolution de la situation et orientations vers les services."
        action={
          <div className="flex gap-2">
            {can("visit.record") && <Button variant="secondary" className="h-8 px-3" icon={<Plus className="size-3.5" />} onClick={() => setModal("visit")}>Visite</Button>}
            {can("referral.manage") && <Button variant="secondary" className="h-8 px-3" icon={<Plus className="size-3.5" />} onClick={() => setModal("referral")}>Orientation</Button>}
          </div>
        }
      />
      {!!referrals.data?.results.length && (
        <ul className="divide-y divide-line border-b border-line">
          {referrals.data.results.map((r) => (
            <li key={r.id}>
              <button className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-navy-50" onClick={() => setCurrent(r)}>
                <Route className="size-4 text-muted" />
                <span className="min-w-0 flex-1 text-sm">
                  <b>{r.service_label}</b> <span className="text-muted">→ {r.partner_name}</span>
                </span>
                <Badge tone={FOLLOWUP_TONE[r.status]}>{r.status_label}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
      <VisitList visits={visits.data?.results} />
      <VisitModal open={modal === "visit"} person={person} onClose={() => setModal(null)} onSaved={() => { setModal(null); visits.mutate(); }} />
      <ReferralModal open={modal === "referral"} person={person} onClose={() => setModal(null)} onSaved={() => { setModal(null); referrals.mutate(); }} />
      <ReferralUpdate referral={current} onClose={() => setCurrent(null)} onChanged={() => { setCurrent(null); referrals.mutate(); }} />
    </Card>
  );
}
