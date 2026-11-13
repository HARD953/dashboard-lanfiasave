"use client";

import { CheckCircle2, HandHeart, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { ApiError, api, useApi } from "@/lib/api";
import { STATUS_TONE, formatDate, formatMoney } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Assistance, Catalogs, Partner } from "@/lib/types";
import { Alert, Badge, Button, EmptyState, Field, Input, Modal, Select, Textarea } from "./ui";

/** Formulaire « Enregistrer une aide » (planifiée, ou remise immédiatement avec preuve). */
export function AidModal({
  open,
  onClose,
  personId,
  personName,
  operationCaseId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  personId: string;
  personName?: string;
  operationCaseId?: string;
  onSaved: () => void;
}) {
  const { organizationId, can } = useSession();
  const { data: catalogs } = useApi<Catalogs>(open ? "catalogs/" : null);
  const { data: partners } = useApi<Partner[]>(open && organizationId ? `partners/?organization=${organizationId}&is_active=true` : null);
  const empty = {
    category: "food",
    description: "",
    amount: "",
    quantity: "",
    unit: "",
    provider: "",
    planned_date: "",
    deliver_now: false,
    delivery_proof: "",
    delivery_channel: "hand",
  };
  const [f, setF] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("assistances/", {
        method: "POST",
        json: {
          person: personId,
          operation_case: operationCaseId ?? null,
          category: f.category,
          description: f.description,
          amount: f.amount || null,
          quantity: f.quantity || null,
          unit: f.unit,
          provider: f.provider || null,
          planned_date: f.planned_date || null,
          deliver_now: f.deliver_now,
          delivery_proof: f.delivery_proof,
          delivery_channel: f.delivery_channel,
        },
      });
      setF(empty);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enregistrer une aide${personName ? ` — ${personName}` : ""}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="accent" loading={busy} disabled={f.deliver_now && !f.delivery_proof.trim()} onClick={submit}>
            {f.deliver_now ? "Enregistrer comme remise" : "Planifier l'aide"}
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Type d'aide" required>
            <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {catalogs?.assistance_categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Détail" hint="Ex. kit de 25 kg de riz, frais de scolarité 2026-2027…">
            <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
        </div>
        <Field label="Montant ou valeur (FCFA)">
          <Input type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </Field>
        <Field label="Structure qui apporte l'aide">
          <Select value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })}>
            <option value="">— Notre organisation —</option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.acronym || p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantité">
          <Input type="number" min={0} step="any" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
        </Field>
        <Field label="Unité">
          <Input value={f.unit} placeholder="kg, kit, mois…" onChange={(e) => setF({ ...f, unit: e.target.value })} />
        </Field>
        {!f.deliver_now && (
          <Field label="Date prévue">
            <Input type="date" value={f.planned_date} onChange={(e) => setF({ ...f, planned_date: e.target.value })} />
          </Field>
        )}
      </div>
      {can("assistance.deliver") && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-teal-600" checked={f.deliver_now} onChange={(e) => setF({ ...f, deliver_now: e.target.checked })} />
          L&apos;aide a déjà été remise
        </label>
      )}
      {f.deliver_now && <DeliveryFields value={f} onChange={(v) => setF({ ...f, ...v })} />}
    </Modal>
  );
}

function DeliveryFields({
  value,
  onChange,
}: {
  value: { delivery_proof: string; delivery_channel: string };
  onChange: (v: { delivery_proof?: string; delivery_channel?: string }) => void;
}) {
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  return (
    <div className="grid gap-3 rounded-lg bg-success-50 p-3 sm:grid-cols-2">
      <Field label="Preuve de remise" hint="Reçu, liste émargée, n° de transaction mobile money…" required>
        <Input value={value.delivery_proof} onChange={(e) => onChange({ delivery_proof: e.target.value })} />
      </Field>
      <Field label="Mode de remise">
        <Select value={value.delivery_channel} onChange={(e) => onChange({ delivery_channel: e.target.value })}>
          {catalogs?.delivery_channels.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** Liste des aides avec confirmation de remise et annulation motivée. */
export function AidList({
  aids,
  onChanged,
  showPerson = false,
  emptyText = "Aucune aide enregistrée.",
}: {
  aids: Assistance[] | undefined;
  onChanged: () => void;
  showPerson?: boolean;
  emptyText?: string;
}) {
  const { can } = useSession();
  const [deliver, setDeliver] = useState<Assistance | null>(null);
  const [cancel, setCancel] = useState<Assistance | null>(null);
  const [proof, setProof] = useState({ delivery_proof: "", delivery_channel: "hand" });
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, close: () => void) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      close();
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!aids?.length) return <EmptyState icon={<HandHeart className="size-6" />} title={emptyText} />;

  return (
    <>
      <ul className="divide-y divide-line">
        {aids.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start gap-3 px-5 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy-900">
                {a.category_label}
                {a.amount && <span className="tabular ml-2 font-normal text-muted">{formatMoney(a.amount)}</span>}
                {a.quantity && (
                  <span className="ml-2 font-normal text-muted">
                    {Number(a.quantity).toLocaleString("fr-FR")} {a.unit}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">
                {showPerson && (
                  <>
                    {a.person_name} ({a.person_code}) ·{" "}
                  </>
                )}
                {a.description && <>{a.description} · </>}
                {a.provider_name ?? "Notre organisation"}
                {a.operation_title && <> · {a.operation_title}</>}
              </p>
              <p className="text-xs text-muted">
                {a.status === "delivered"
                  ? `Remise le ${formatDate(a.delivered_at, true)} — preuve : ${a.delivery_proof}${a.delivered_by_name ? ` — ${a.delivered_by_name}` : ""}`
                  : a.status === "cancelled"
                    ? `Annulée : ${a.cancel_reason}`
                    : `Planifiée${a.planned_date ? ` pour le ${formatDate(a.planned_date)}` : ""} par ${a.recorded_by_name ?? "—"}`}
              </p>
            </div>
            <Badge tone={STATUS_TONE[a.status]}>{a.status_label}</Badge>
            <span className="flex gap-1">
              {a.status === "planned" && can("assistance.deliver") && (
                <Button variant="ghost" className="h-8 px-2" icon={<CheckCircle2 className="size-4" />} onClick={() => setDeliver(a)}>
                  Remise
                </Button>
              )}
              {a.status !== "cancelled" && can("assistance.record") && (a.status === "planned" || can("assistance.deliver")) && (
                <Button variant="ghost" className="h-8 px-2" icon={<XCircle className="size-4" />} onClick={() => setCancel(a)}>
                  Annuler
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <Modal
        open={!!deliver}
        onClose={() => setDeliver(null)}
        title="Confirmer la remise"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeliver(null)}>
              Annuler
            </Button>
            <Button
              variant="accent"
              loading={busy}
              disabled={!proof.delivery_proof.trim()}
              onClick={() =>
                deliver && run(() => api(`assistances/${deliver.id}/deliver/`, { method: "POST", json: proof }), () => setDeliver(null))
              }
            >
              Confirmer
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger">{error}</Alert>}
        <p className="text-sm">
          {deliver?.category_label} pour <b>{deliver?.person_name}</b>. Une aide n&apos;est comptée comme reçue qu&apos;avec une preuve.
        </p>
        <DeliveryFields value={proof} onChange={(v) => setProof({ ...proof, ...v })} />
      </Modal>
      <Modal
        open={!!cancel}
        onClose={() => setCancel(null)}
        title="Annuler l'aide"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancel(null)}>
              Retour
            </Button>
            <Button
              variant="danger"
              loading={busy}
              disabled={reason.trim().length < 5}
              onClick={() =>
                cancel && run(() => api(`assistances/${cancel.id}/cancel/`, { method: "POST", json: { reason } }), () => setCancel(null))
              }
            >
              Annuler l&apos;aide
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger">{error}</Alert>}
        <Alert tone="info">L&apos;aide n&apos;est pas supprimée : elle reste visible avec le motif d&apos;annulation.</Alert>
        <Field label="Motif" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}

export function AddAidButton({ onClick }: { onClick: () => void }) {
  const { can } = useSession();
  if (!can("assistance.record")) return null;
  return (
    <Button variant="secondary" className="h-8 px-3" icon={<Plus className="size-3.5" />} onClick={onClick}>
      Aide
    </Button>
  );
}
