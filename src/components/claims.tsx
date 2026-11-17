"use client";

import { useState } from "react";
import { Alert, Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import type { Tone } from "@/lib/format";
import { useSession } from "@/lib/session";

export type Option = { value: string; label: string };
export type ClaimsMeta = {
  sectors: Option[];
  services: Option[];
  impacts: (Option & { sectors: string[]; service: string })[];
  watch_list: Record<string, string>;
  profiles: (Option & { help: string })[];
  sources: Option[];
  urgency_reasons: Option[];
  channels: Option[];
  statuses: Option[];
  outcomes: Option[];
  protected_kinds: Option[];
  delays: Record<string, number>;
  integrations: { sms: boolean; rsu: boolean };
};

export type Decision = {
  id: string;
  outcome: string;
  outcome_label: string;
  motive: string;
  measures: string[];
  amount: number | null;
  committee_members: string[];
  proposed_by_name: string;
  validation: "pending" | "validated" | "returned";
  validation_label: string;
  validated_by_name: string | null;
  validated_at: string | null;
  validation_note: string;
  after_appeal: boolean;
  created_at: string;
};
export type ClaimAppeal = {
  id: string;
  reference: string;
  claim: string;
  claim_reference: string;
  motive: string;
  status: "open" | "upheld" | "dismissed";
  status_label: string;
  independent_member: string;
  resolution: string;
  resolved_at: string | null;
  decision_modified: boolean;
  response_due: string;
  is_overdue: boolean;
  created_at: string;
};
export type Claim = {
  id: string;
  organization: string;
  reference: string;
  operation: string | null;
  operation_title: string | null;
  operator: string | null;
  operator_name: string | null;
  territory: string | null;
  territory_name: string | null;
  claimant_name: string;
  claimant_sex: string;
  claimant_birth_year: number | null;
  claimant_phone: string;
  language: string;
  village: string;
  household_size: number;
  women_head: boolean;
  has_dependent_person: boolean;
  channel: string;
  channel_label: string;
  sector: string;
  sector_label: string;
  impacts: string[];
  impact_labels: string[];
  profile: string;
  profile_label: string;
  sources: string[];
  impact_date: string | null;
  description: string;
  assets_lost: string;
  income_before: number | null;
  income_after: number | null;
  aid_received: string;
  no_identity_document: boolean;
  community_validated: boolean;
  community_validation_note: string;
  consent_operator_contact: boolean;
  in_operator_list: boolean | null;
  rsu_status: string;
  rsu_status_label: string;
  status: string;
  status_label: string;
  urgent: boolean;
  urgency_reason: string;
  registered_at: string;
  receipt_issued_at: string | null;
  notified_at: string | null;
  closed_at: string | null;
  closure_motive: string;
  assigned_to_name: string | null;
  social_inquiry: string;
  technical_service: string;
  technical_opinion: string;
  link_confirmed: string;
  transmitted_to_operator_at: string | null;
  operator_response: string;
  operator_responded_at: string | null;
  priority_score: number;
  priority_factors: { label: string; points: number }[];
  priority_override: number | null;
  override_motive: string;
  effective_priority: number;
  deadlines: Record<string, string | null>;
  is_overdue: boolean;
  decision_days: number | null;
  appeal_deadline: string | null;
  recorded_by_name: string | null;
  access_mode: "full" | "own" | "operator" | "evaluator";
  decisions?: Decision[];
  appeals?: ClaimAppeal[];
  urgent_measures?: { id: string; reason_label: string; measure: string; ordered_by_name: string; created_at: string; executed_at: string | null; execution_note: string; executed_in_time: boolean | null }[];
  events?: { kind: string; note: string; to_status: string; at: string; actor: string | null }[];
  payments?: { id: string; amount: string; status: string; channel: string; delivered_at: string | null; proof: boolean }[];
};

export const CLAIM_TONE: Record<string, Tone> = {
  registered: "info",
  triaged: "info",
  verifying: "warning",
  proposed: "gold",
  decided: "success",
  support: "success",
  followup: "success",
  closed: "neutral",
};

export const STEPS = [
  { status: "registered", label: "Enregistrement", due: "receipt", delay: "48 h" },
  { status: "triaged", label: "Tri", due: "triage", delay: "5 j ouvrés" },
  { status: "verifying", label: "Vérification", due: "verification", delay: "15 j ouvrés" },
  { status: "proposed", label: "Décision motivée", due: "decision", delay: "≤ 30 jours" },
  { status: "support", label: "Appui ou orientation", due: null, delay: "selon cas" },
  { status: "followup", label: "Suivi", due: "followup", delay: "3 mois" },
  { status: "closed", label: "Clôture motivée", due: null, delay: "" },
];
const ORDER = ["registered", "triaged", "verifying", "proposed", "decided", "support", "followup", "closed"];
export function stepIndex(status: string) {
  const i = ORDER.indexOf(status);
  return i >= 4 ? i - 1 : i; // « décidée » s'affiche avec la décision motivée
}

export function useClaimsMeta() {
  return useApi<ClaimsMeta>("claims-meta/");
}

const EMPTY = {
  claimant_name: "",
  claimant_sex: "F",
  claimant_birth_year: "",
  claimant_phone: "",
  language: "",
  village: "",
  territory: "",
  household_size: "1",
  women_head: false,
  has_dependent_person: false,
  channel: "relay",
  sector: "mining",
  impacts: [] as string[],
  profile: "",
  sources: ["self"] as string[],
  impact_date: "",
  description: "",
  assets_lost: "",
  income_before: "",
  income_after: "",
  aid_received: "",
  no_identity_document: false,
  community_validated: false,
  community_validation_note: "",
  consent_operator_contact: false,
  operation: "",
  operator: "",
  urgent: false,
  urgency_reason: "",
};

/** Formulaire minimal (diapositive 21) : ni ethnie, ni religion, ni diagnostic médical, ni biométrie. */
export function ClaimFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (c: Claim) => void }) {
  const { organizationId } = useSession();
  const { data: meta } = useClaimsMeta();
  const { data: territories } = useApi<{ id: string; name: string; level: string; parent_name: string | null }[]>(open ? "territories/" : null);
  const { data: operations } = useApi<{ results: { id: string; title: string; kind: string; initiated_by: string | null }[] }>(
    open && organizationId ? `operations/?organization=${organizationId}` : null,
  );
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target instanceof HTMLInputElement && e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const toggle = (k: "impacts" | "sources", v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const impacts = meta?.impacts.filter((i) => i.sectors.includes(f.sector)) ?? [];

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const op = operations?.results.find((o) => o.id === f.operation);
      const num = (v: string) => (v === "" ? null : Number(v));
      const c = await api<Claim>("claims/", {
        method: "POST",
        json: {
          ...f,
          organization: organizationId,
          claimant_birth_year: num(f.claimant_birth_year),
          household_size: Number(f.household_size || 1),
          income_before: num(f.income_before),
          income_after: num(f.income_after),
          impact_date: f.impact_date || null,
          territory: f.territory || null,
          operation: f.operation || null,
          operator: f.operator || op?.initiated_by || null,
          urgency_reason: f.urgent ? f.urgency_reason : "",
        },
      });
      setF(EMPTY);
      onSaved(c);
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enregistrer une demande"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={save} loading={saving} disabled={!f.claimant_name || !f.impacts.length}>Enregistrer et remettre le récépissé</Button>
        </>
      }
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        {error && <Alert tone="danger">{error}</Alert>}
        <p className="text-xs text-muted">
          Ne collecter que ce qui sert à examiner la demande. Jamais d&apos;origine ethnique, de religion, d&apos;opinion, de donnée biométrique ni de
          diagnostic médical. L&apos;absence de pièce d&apos;identité n&apos;empêche jamais l&apos;enregistrement.
        </p>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold text-navy-900">Le ménage</legend>
          <Field label="Nom et prénom" required><Input value={f.claimant_name} onChange={set("claimant_name")} /></Field>
          <Field label="Sexe">
            <Select value={f.claimant_sex} onChange={set("claimant_sex")}><option value="F">Femme</option><option value="M">Homme</option></Select>
          </Field>
          <Field label="Année de naissance"><Input inputMode="numeric" value={f.claimant_birth_year} onChange={set("claimant_birth_year")} /></Field>
          <Field label="Taille du ménage"><Input inputMode="numeric" value={f.household_size} onChange={set("household_size")} /></Field>
          <Field label="Village"><Input value={f.village} onChange={set("village")} /></Field>
          <Field label="Sous-préfecture ou village (référentiel)">
            <Select value={f.territory} onChange={set("territory")}>
              <option value="">—</option>
              {territories?.filter((t) => ["subprefecture", "village", "commune", "department"].includes(t.level)).map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.parent_name ? ` (${t.parent_name})` : ""}</option>
              ))}
            </Select>
          </Field>
          <Field label="Téléphone (facultatif)" hint="Avec l'accord de la personne"><Input value={f.claimant_phone} onChange={set("claimant_phone")} /></Field>
          <Field label="Langue du ménage" hint="Le récépissé est lu à voix haute"><Input value={f.language} onChange={set("language")} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.women_head} onChange={set("women_head")} /> Femme cheffe de ménage</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.has_dependent_person} onChange={set("has_dependent_person")} /> Personne dépendante dans le ménage</label>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold text-navy-900">L&apos;impact</legend>
          <Field label="Secteur">
            <Select value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value, impacts: [] })}>
              {meta?.sectors.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Site ou projet">
            <Select value={f.operation} onChange={set("operation")}>
              <option value="">—</option>
              {operations?.results.filter((o) => ["mining_project", "oil_gas", "energy", "illegal_mining", "infrastructure"].includes(o.kind)).map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-ink">Ce qui a été perdu ou perturbé <span className="text-danger">*</span></p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {impacts.map((i) => (
                <label key={i.value} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5" checked={f.impacts.includes(i.value)} onChange={() => toggle("impacts", i.value)} />
                  {i.label}
                </label>
              ))}
            </div>
            {meta?.watch_list[f.sector] && <p className="mt-2 text-xs text-muted">Ménages à repérer : {meta.watch_list[f.sector]}.</p>}
          </div>
          <Field label="Profil du ménage">
            <Select value={f.profile} onChange={set("profile")}>
              <option value="">À préciser au tri</option>
              {meta?.profiles.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </Field>
          <Field label="Date de l'impact"><Input type="date" value={f.impact_date} onChange={set("impact_date")} /></Field>
          <Field label="Revenu mensuel avant (FCFA)"><Input inputMode="numeric" value={f.income_before} onChange={set("income_before")} /></Field>
          <Field label="Revenu mensuel après (FCFA)"><Input inputMode="numeric" value={f.income_after} onChange={set("income_after")} /></Field>
          <div className="sm:col-span-2"><Field label="Ce que dit le ménage"><Textarea value={f.description} onChange={set("description")} /></Field></div>
          <Field label="Biens ou accès perdus"><Input value={f.assets_lost} onChange={set("assets_lost")} /></Field>
          <Field label="Aides ou indemnisations déjà reçues"><Input value={f.aid_received} onChange={set("aid_received")} /></Field>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold text-navy-900">Enregistrement</legend>
          <Field label="Canal">
            <Select value={f.channel} onChange={set("channel")}>
              {meta?.channels.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Sources de repérage</p>
            {meta?.sources.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.sources.includes(s.value)} onChange={() => toggle("sources", s.value)} /> {s.label}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.no_identity_document} onChange={set("no_identity_document")} /> Sans pièce d&apos;identité</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.community_validated} onChange={set("community_validated")} /> Validation communautaire faite</label>
          {f.community_validated && (
            <div className="sm:col-span-2"><Field label="Validation communautaire" hint="Ex. : devant le chef de village et deux témoins"><Input value={f.community_validation_note} onChange={set("community_validation_note")} /></Field></div>
          )}
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.consent_operator_contact} onChange={set("consent_operator_contact")} /> Accepte que l&apos;exploitant reçoive ses coordonnées</label>
          <label className="flex items-center gap-2 text-sm font-medium text-danger"><input type="checkbox" checked={f.urgent} onChange={set("urgent")} /> Urgence</label>
          {f.urgent && (
            <Select value={f.urgency_reason} onChange={set("urgency_reason")} aria-label="Motif d'urgence">
              <option value="">Motif…</option>
              {meta?.urgency_reasons.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </Select>
          )}
        </fieldset>
      </div>
    </Modal>
  );
}
