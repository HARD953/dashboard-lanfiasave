"use client";

import clsx from "clsx";
import { CheckCircle2, Circle, Clock, Printer, Siren } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CLAIM_TONE, STEPS, stepIndex, useClaimsMeta, type Claim } from "@/components/claims";
import { Alert, Badge, Button, Card, CardHeader, DefinitionList, Field, Input, Modal, PageHeader, Select, Spinner, Textarea } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { useSession } from "@/lib/session";

type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "checkbox" | "multi" | "lines" | "hidden";
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  initial?: string | boolean | string[];
};
type ActionDef = { key: string; label: string; title: string; path: string; fields: FieldDef[]; variant?: "primary" | "secondary" | "accent" | "danger"; note?: string };

function ActionModal({ action, claimId, onClose, onDone }: { action: ActionDef; claimId: string; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState<Record<string, string | boolean | string[]>>(() =>
    Object.fromEntries(action.fields.map((f) => [f.name, f.initial ?? (f.type === "checkbox" ? false : f.type === "multi" ? [] : "")])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const missing = action.fields.some((f) => f.required && (v[f.name] === "" || (Array.isArray(v[f.name]) && !(v[f.name] as string[]).length)));

  async function submit() {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {};
    for (const f of action.fields) {
      const val = v[f.name];
      if (f.type === "number") body[f.name] = val === "" ? null : Number(String(val).replace(/\s/g, ""));
      else if (f.type === "lines") body[f.name] = String(val).split("\n").map((s) => s.trim()).filter(Boolean);
      else body[f.name] = val;
    }
    try {
      await api(action.path.startsWith("claim-appeals") ? action.path : `claims/${claimId}/${action.path}`, { method: "POST", json: body });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Action impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={action.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant={action.variant === "danger" ? "danger" : "primary"} onClick={submit} loading={saving} disabled={missing}>{action.label}</Button>
        </>
      }
    >
      {action.note && <p className="text-sm text-muted">{action.note}</p>}
      {error && <Alert tone="danger">{error}</Alert>}
      {action.fields.map((f) => {
        const val = v[f.name];
        const set = (x: string | boolean | string[]) => setV({ ...v, [f.name]: x });
        if (f.type === "hidden") return null;
        if (f.type === "checkbox")
          return (
            <label key={f.name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(val)} onChange={(e) => set(e.target.checked)} /> {f.label}
            </label>
          );
        if (f.type === "multi")
          return (
            <div key={f.name}>
              <p className="mb-1.5 text-sm font-medium text-ink">{f.label}</p>
              <div className="grid gap-1 sm:grid-cols-2">
                {f.options?.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(val as string[]).includes(o.value)}
                      onChange={() => set((val as string[]).includes(o.value) ? (val as string[]).filter((x) => x !== o.value) : [...(val as string[]), o.value])}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          );
        return (
          <Field key={f.name} label={f.label} required={f.required} hint={f.hint}>
            {f.type === "select" ? (
              <Select value={String(val)} onChange={(e) => set(e.target.value)}>
                <option value="">—</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : f.type === "textarea" || f.type === "lines" ? (
              <Textarea value={String(val)} onChange={(e) => set(e.target.value)} />
            ) : (
              <Input inputMode={f.type === "number" ? "numeric" : undefined} value={String(val)} onChange={(e) => set(e.target.value)} />
            )}
          </Field>
        );
      })}
    </Modal>
  );
}

const SERVICE_OPTIONS = [
  { value: "rsu", label: "Inscription au Registre social unique" },
  { value: "health", label: "Centre de santé" },
  { value: "cmu", label: "CMU" },
  { value: "civil_registry", label: "État civil" },
  { value: "school", label: "École" },
  { value: "employment", label: "Emploi / formation" },
  { value: "legal", label: "Aide juridique" },
  { value: "housing", label: "Logement" },
  { value: "psychosocial", label: "Soutien psychosocial" },
];

export default function ClaimDetail({ id }: { id: string }) {
  const fresh = useSearchParams().get("recu") === "1";
  const { can } = useSession();
  const { data: meta } = useClaimsMeta();
  const { data: c, mutate, error, isLoading } = useApi<Claim>(`claims/${id}/`);
  const [action, setAction] = useState<ActionDef | null>(null);
  const [rsuMsg, setRsuMsg] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (error || !c) return <Alert tone="danger">{error?.status === 404 ? "Demande introuvable ou hors de votre périmètre." : error?.message ?? "Erreur."}</Alert>;

  const operatorView = c.access_mode === "operator";
  const pending = c.decisions?.find((d) => d.validation === "pending");
  const current = c.decisions?.find((d) => d.validation === "validated");
  const openAppeal = c.appeals?.find((a) => a.status === "open");
  const st = c.status;
  const opts = (xs?: { value: string; label: string }[]) => xs ?? [];

  const actions: ActionDef[] = [];
  if (can("claim.process") && st === "registered")
    actions.push({
      key: "triage", label: "Trier", title: "Tri et orientation (5 jours ouvrés)", path: "triage/", variant: "accent",
      fields: [
        { name: "profile", label: "Profil du ménage", type: "select", options: opts(meta?.profiles), initial: c.profile },
        { name: "technical_service", label: "Service technique à saisir", type: "select", options: opts(meta?.services), initial: c.technical_service },
        { name: "urgent", label: "Urgence (eau, alimentation, santé, sécurité)", type: "checkbox", initial: c.urgent },
        { name: "urgency_reason", label: "Motif d'urgence", type: "select", options: opts(meta?.urgency_reasons), initial: c.urgency_reason },
        { name: "note", label: "Note de tri", type: "textarea" },
      ],
    });
  if (can("claim.process") && ["triaged", "verifying"].includes(st))
    actions.push({ key: "inquiry", label: "Enregistrer", title: "Visite et enquête sociale", path: "inquiry/", fields: [{ name: "social_inquiry", label: "Constat de la visite", type: "textarea", required: true, initial: c.social_inquiry }] });
  if ((can("claim.process") || can("claim.technical_opinion")) && ["triaged", "verifying"].includes(st))
    actions.push({
      key: "tech", label: "Enregistrer l'avis", title: "Avis du service technique", path: "technical-opinion/",
      fields: [
        { name: "service", label: "Service", type: "select", options: opts(meta?.services), initial: c.technical_service },
        { name: "link_confirmed", label: "Lien avec l'activité", type: "select", required: true, options: [{ value: "yes", label: "Confirmé" }, { value: "no", label: "Non établi" }, { value: "uncertain", label: "Incertain" }] },
        { name: "opinion", label: "Avis (pertes de cultures, accès à l'eau, pêche…)", type: "textarea", required: true },
      ],
    });
  if (can("claim.propose") && st === "verifying")
    actions.push({
      key: "propose", label: "Proposer", title: "Proposition de décision motivée (comité local)", path: "propose/", variant: "accent",
      note: "La décision sera validée par le préfet ou son délégué, puis lue au ménage. Le motif doit être compréhensible par lui.",
      fields: [
        { name: "outcome", label: "Issue", type: "select", required: true, options: opts(meta?.outcomes) },
        { name: "motive", label: "Motif", type: "textarea", required: true },
        { name: "amount", label: "Montant de l'appui (FCFA)", type: "number" },
        { name: "measures", label: "Mesures (une par ligne)", type: "lines" },
        { name: "committee_members", label: "Membres présents (un par ligne)", type: "lines" },
      ],
    });
  if (can("claim.validate") && st === "proposed" && pending) {
    actions.push({ key: "validate", label: "Valider et notifier", title: "Validation de la décision", path: "validate/", variant: "accent", fields: [{ name: "approve", label: "Je valide la proposition du comité", type: "checkbox", initial: true }, { name: "note", label: "Observation", type: "textarea" }] });
    actions.push({ key: "return", label: "Renvoyer", title: "Renvoyer au comité", path: "validate/", variant: "danger", fields: [{ name: "note", label: "Motif du renvoi", type: "textarea", required: true }] });
  }
  if (can("claim.urgent_order") && st !== "closed")
    actions.push({ key: "urgent", label: "Ordonner", title: "Mesure d'urgence (72 h)", path: "urgent/", variant: "danger", fields: [{ name: "reason", label: "Motif", type: "select", required: true, options: opts(meta?.urgency_reasons), initial: c.urgency_reason }, { name: "measure", label: "Mesure ordonnée", type: "textarea", required: true }] });
  if (can("claim.process") && c.operator && !c.transmitted_to_operator_at && !["registered", "closed"].includes(st))
    actions.push({ key: "transmit", label: "Transmettre", title: `Transmettre à ${c.operator_name}`, path: "transmit/", note: "Le promoteur reçoit l'impact et la réclamation. Il ne reçoit les coordonnées qu'avec l'accord du ménage, et jamais les plaintes confidentielles.", fields: [] });
  if (can("claim.operator") && c.transmitted_to_operator_at && !c.operator_responded_at)
    actions.push({ key: "operator", label: "Envoyer la réponse", title: "Réponse du promoteur", path: "operator-response/", variant: "accent", fields: [{ name: "response", label: "Réponse motivée", type: "textarea", required: true }] });
  if (can("claim.process") && st === "decided" && current && current.outcome !== "rejected")
    actions.push({
      key: "support", label: "Engager", title: "Appui ou orientation", path: "support/", variant: "accent",
      fields: [
        { name: "amount", label: "Montant validé (FCFA)", type: "number", initial: current.amount ? String(current.amount) : "" },
        { name: "channel", label: "Moyen de paiement", type: "select", options: [{ value: "mobile_money", label: "Mobile money" }, { value: "hand", label: "Espèces contre reçu" }, { value: "voucher", label: "Carte ou bon" }, { value: "service", label: "En nature" }], initial: "mobile_money" },
        { name: "services", label: "Orientations", type: "multi", options: SERVICE_OPTIONS },
      ],
    });
  if (can("claim.process") && ["support", "followup"].includes(st))
    actions.push({ key: "followup", label: "Enregistrer", title: "Visite de suivi", path: "followup/", fields: [{ name: "note", label: "Constat", type: "textarea", required: true }] });
  if (can("claim.process") && (["support", "followup"].includes(st) || (st === "decided" && current?.outcome === "rejected")) && !openAppeal)
    actions.push({ key: "close", label: "Clôturer", title: "Clôture motivée", path: "close/", variant: "danger", fields: [{ name: "motive", label: "Motif de clôture", type: "textarea", required: true }] });
  if (can("claim.appeal_file") && c.notified_at && !openAppeal && c.appeal_deadline && new Date(c.appeal_deadline) >= new Date(new Date().toDateString()))
    actions.push({ key: "appeal", label: "Enregistrer", title: "Contestation (30 jours)", path: "appeal/", note: `Contestation possible jusqu'au ${formatDate(c.appeal_deadline)}. Les recours administratifs et judiciaires restent ouverts dans tous les cas.`, fields: [{ name: "motive", label: "Motif de la contestation", type: "textarea", required: true }] });
  if (can("claim.appeal_resolve") && openAppeal)
    actions.push({
      key: "resolve", label: "Statuer", title: `Commission de recours — ${openAppeal.reference}`, path: `claim-appeals/${openAppeal.id}/resolve/`, variant: "accent",
      fields: [
        { name: "upheld", label: "Contestation accueillie (nouvel examen)", type: "checkbox" },
        { name: "independent_member", label: "Membre indépendant présent", type: "text", required: true },
        { name: "commission_members", label: "Autres membres (un par ligne)", type: "lines" },
        { name: "resolution", label: "Réponse motivée", type: "textarea", required: true },
      ],
    });
  if (can("claim.process") && st !== "closed")
    actions.push({ key: "priority", label: "Fixer", title: "S'écarter de l'ordre d'examen", path: "priority/", note: "L'examinateur peut s'écarter du score en écrivant son motif. Ce choix est tracé.", fields: [{ name: "value", label: "Ordre d'examen (0 à 100)", type: "number", required: true }, { name: "motive", label: "Motif", type: "textarea", required: true }] });

  async function rsu(kind: "check" | "refer") {
    try {
      const r = await api<{ message?: string; configured?: boolean }>(`claims/${id}/rsu/`, { method: "POST", json: { action: kind } });
      setRsuMsg(kind === "refer" ? "Orientation vers une inscription gratuite au RSU enregistrée." : r.message ?? "Vérification faite.");
      mutate();
    } catch (e) {
      setRsuMsg(e instanceof ApiError ? e.readable : "Action impossible.");
    }
  }

  const idx = stepIndex(st);
  return (
    <>
      <PageHeader
        back={{ href: "/demandes", label: "Demandes" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.reference}
            <Badge tone={CLAIM_TONE[st]}>{c.status_label}</Badge>
            {c.urgent && <Badge tone="danger">Urgence</Badge>}
            {c.is_overdue && <Badge tone="danger">En retard</Badge>}
          </span>
        }
        subtitle={[c.claimant_name, ...new Set([c.village, c.territory_name].filter(Boolean))].join(" · ")}
        actions={!operatorView && <Link href={`/recepisse/${c.id}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-navy-50"><Printer className="size-4" />Récépissé</Link>}
      />
      {fresh && <Alert tone="success" title={`Demande enregistrée : ${c.reference}`}>Remettez le récépissé au ménage et lisez-le à voix haute. Décision motivée au plus tard le {formatDate(c.deadlines.decision)}.</Alert>}
      {c.access_mode === "evaluator" && <Alert tone="info">Consultation dans le cadre de l&apos;évaluation indépendante : cet accès est journalisé.</Alert>}

      {!operatorView && (
        <Card className="my-6 p-5">
          <ol className="grid gap-3 md:grid-cols-7">
            {STEPS.map((s, i) => {
              const done = i < idx || st === "closed";
              const active = i === idx && st !== "closed";
              const due = s.due ? c.deadlines[s.due] : null;
              return (
                <li key={s.status} className={clsx("rounded-lg p-3 text-sm", active ? "bg-teal-50 ring-1 ring-teal-200" : "bg-navy-50/50")}>
                  <span className="flex items-center gap-1.5 font-semibold text-ink">
                    {done ? <CheckCircle2 className="size-4 text-success" /> : active ? <Clock className="size-4 text-teal-700" /> : <Circle className="size-4 text-soft" />}
                    {s.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{s.delay}</span>
                  {due && !done && <span className={clsx("block text-xs", active && c.is_overdue ? "font-semibold text-danger" : "text-muted")}>avant le {formatDate(due)}</span>}
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="La demande" />
            <div className="p-5">
              <DefinitionList
                items={[
                  { label: "Secteur", value: c.sector_label },
                  { label: "Site ou projet", value: c.operation_title },
                  { label: "Impacts", value: c.impact_labels.join(" ; ") },
                  { label: "Date de l'impact", value: formatDate(c.impact_date) },
                  { label: "Biens ou accès perdus", value: c.assets_lost },
                  { label: "Taille du ménage", value: c.household_size },
                  ...(operatorView
                    ? []
                    : [
                        { label: "Profil", value: c.profile_label },
                        { label: "Revenu avant → après", value: c.income_before ? `${formatMoney(c.income_before)} → ${formatMoney(c.income_after ?? 0)}` : null },
                        { label: "Aides déjà reçues", value: c.aid_received },
                        { label: "Canal", value: c.channel_label },
                        { label: "Identité", value: c.no_identity_document ? (c.community_validated ? `Sans pièce — validation communautaire${c.community_validation_note ? ` (${c.community_validation_note})` : ""}` : "Sans pièce — validation communautaire à faire") : "Pièce présentée" },
                        { label: "Liste du promoteur", value: c.in_operator_list === null ? "Non rapprochée" : c.in_operator_list ? "Présent" : "Absent de la liste" },
                        { label: "Registre social unique", value: c.rsu_status_label },
                        { label: "Enregistrée par", value: c.recorded_by_name },
                      ]),
                ]}
              />
              {c.description && <p className="mt-4 rounded-lg bg-navy-50/60 p-3 text-sm italic text-ink">« {c.description} »</p>}
            </div>
          </Card>

          {!operatorView && (c.social_inquiry || c.technical_opinion) && (
            <Card>
              <CardHeader title="Vérification" />
              <div className="space-y-3 p-5 text-sm">
                {c.social_inquiry && <p><b>Enquête sociale :</b> {c.social_inquiry}</p>}
                {c.technical_opinion && <p><b>Avis technique ({c.technical_service || "service"}) :</b> {c.technical_opinion} <Badge tone={c.link_confirmed === "yes" ? "success" : c.link_confirmed === "no" ? "danger" : "warning"}>{c.link_confirmed === "yes" ? "Lien confirmé" : c.link_confirmed === "no" ? "Lien non établi" : "Lien incertain"}</Badge></p>}
              </div>
            </Card>
          )}

          {!!c.decisions?.length && (
            <Card>
              <CardHeader title="Décisions" />
              <ul className="divide-y divide-line">
                {c.decisions.map((d) => (
                  <li key={d.id} className="p-5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-ink">{d.outcome_label}</b>
                      <Badge tone={d.validation === "validated" ? "success" : d.validation === "returned" ? "danger" : "gold"}>{d.validation_label}</Badge>
                      {d.after_appeal && <Badge tone="info">Après contestation</Badge>}
                      {d.amount && <span className="tabular">{formatMoney(d.amount)}</span>}
                    </div>
                    <p className="mt-2 text-ink">{d.motive}</p>
                    {!!d.measures.length && <p className="mt-1 text-muted">Mesures : {d.measures.join(" ; ")}</p>}
                    <p className="mt-1 text-xs text-muted">
                      Proposée par {d.proposed_by_name} le {formatDate(d.created_at)}
                      {d.validated_by_name && ` · ${d.validation === "returned" ? "renvoyée" : "validée"} par ${d.validated_by_name} le ${formatDate(d.validated_at)}`}
                      {d.validation_note && ` · « ${d.validation_note} »`}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {!!c.appeals?.length && (
            <Card>
              <CardHeader title="Contestations" />
              <ul className="divide-y divide-line">
                {c.appeals.map((a) => (
                  <li key={a.id} className="p-5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs">{a.reference}</span>
                      <Badge tone={a.status === "open" ? (a.is_overdue ? "danger" : "gold") : a.status === "upheld" ? "success" : "neutral"}>{a.status_label}</Badge>
                      {a.status === "open" && <span className="text-xs text-muted">réponse avant le {formatDate(a.response_due)}</span>}
                    </div>
                    <p className="mt-2">{a.motive}</p>
                    {a.resolution && <p className="mt-1 text-muted">Réponse : {a.resolution} {a.independent_member && `(membre indépendant : ${a.independent_member})`}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {operatorView && c.operator_response && (
            <Card className="p-5 text-sm"><b>Votre réponse ({formatDate(c.operator_responded_at)}) :</b> {c.operator_response}</Card>
          )}

          {!!c.events?.length && (
            <Card>
              <CardHeader title="Historique du dossier" />
              <ol className="space-y-3 p-5">
                {c.events.map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-28 shrink-0 text-xs text-muted">{formatDate(e.at, true)}</span>
                    <span>{e.note}{e.actor && <span className="text-muted"> — {e.actor}</span>}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!!actions.length && (
            <Card>
              <CardHeader title="Étapes à faire" />
              <div className="flex flex-col gap-2 p-4">
                {actions.map((a) => (
                  <Button key={a.key} variant={a.variant === "accent" ? "accent" : "secondary"} onClick={() => setAction(a)} className="justify-start">
                    {a.title}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {!operatorView && (
            <Card>
              <CardHeader title="Ordre d'examen" subtitle="Ordonne l'examen ; ne décide jamais." />
              <div className="p-5 text-sm">
                <p className="tabular text-3xl font-bold text-navy-900">{c.effective_priority}<span className="text-base text-muted"> / 100</span></p>
                {c.priority_override !== null && <p className="mt-1 text-xs text-gold-600">Fixé par l&apos;examinateur (score calculé : {c.priority_score}) : {c.override_motive}</p>}
                <ul className="mt-3 space-y-1">
                  {c.priority_factors.map((f) => (
                    <li key={f.label} className="flex justify-between gap-2"><span className="text-muted">{f.label}</span><b className="tabular">+{f.points}</b></li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {!!c.urgent_measures?.length && (
            <Card>
              <CardHeader title="Mesures d'urgence" />
              <ul className="divide-y divide-line">
                {c.urgent_measures.map((m) => (
                  <li key={m.id} className="space-y-1 p-4 text-sm">
                    <p className="flex items-center gap-2 font-medium"><Siren className="size-4 text-danger" />{m.reason_label} : {m.measure}</p>
                    <p className="text-xs text-muted">Ordonnée par {m.ordered_by_name} le {formatDate(m.created_at, true)}</p>
                    {m.executed_at ? (
                      <Badge tone={m.executed_in_time ? "success" : "warning"}>Exécutée {m.executed_in_time ? "sous 72 h" : "hors délai"}</Badge>
                    ) : (
                      can("claim.process") && (
                        <Button variant="secondary" onClick={() => setAction({ key: "exec", label: "Confirmer", title: "Mesure exécutée", path: "urgent-executed/", fields: [{ name: "measure", label: "", type: "hidden", initial: m.id }, { name: "note", label: "Ce qui a été fait", type: "textarea", required: true }] })}>
                          Marquer exécutée
                        </Button>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {!!c.payments?.length && (
            <Card>
              <CardHeader title="Paiements" />
              <ul className="divide-y divide-line">
                {c.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-4 text-sm">
                    <span>{formatMoney(p.amount)} · {p.channel}</span>
                    <Badge tone={p.status === "delivered" ? "success" : "gold"}>{p.status === "delivered" ? `Reçu le ${formatDate(p.delivered_at)}` : "À payer"}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {!operatorView && can("claim.process") && (
            <Card>
              <CardHeader title="Registre social unique" subtitle="Inscription gratuite (décret 2019-759, art. 4)" />
              <div className="space-y-2 p-4">
                <p className="text-sm">Statut : <b>{c.rsu_status_label}</b></p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => rsu("check")}>Vérifier</Button>
                  <Button variant="secondary" onClick={() => rsu("refer")}>Orienter vers l&apos;inscription</Button>
                </div>
                {rsuMsg && <p className="text-xs text-muted">{rsuMsg}</p>}
              </div>
            </Card>
          )}

          {!operatorView && (
            <Card>
              <CardHeader title="Échéances" />
              <ul className="space-y-1.5 p-4 text-sm">
                {[
                  ["Décision motivée", c.deadlines.decision],
                  ["Mesure d'urgence", c.deadlines.urgent],
                  ["Transmission au promoteur", c.deadlines.operator_transmit],
                  ["Réponse du promoteur", c.deadlines.operator_response],
                  ["Fin du suivi", c.deadlines.followup],
                  ["Fin du délai de contestation", c.appeal_deadline],
                ]
                  .filter(([, d]) => d)
                  .map(([l, d]) => (
                    <li key={l} className="flex justify-between gap-2"><span className="text-muted">{l}</span><span className="tabular">{formatDate(d as string, l === "Mesure d'urgence")}</span></li>
                  ))}
                {c.decision_days !== null && <li className="flex justify-between gap-2"><span className="text-muted">Décision rendue en</span><b>{c.decision_days} jours</b></li>}
              </ul>
            </Card>
          )}
        </div>
      </div>
      {action && (
        <ActionModal
          action={action}
          claimId={c.id}
          onClose={() => setAction(null)}
          onDone={() => {
            setAction(null);
            mutate();
          }}
        />
      )}
    </>
  );
}
