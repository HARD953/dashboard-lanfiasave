"use client";

import { Check, Plus, ShieldAlert, Siren, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { STATUS_TONE, formatDate, formatMoney } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Assistance, Catalogs, OperationCase, Vulnerability } from "@/lib/types";
import { AddAidButton, AidList, AidModal } from "./aid";
import { Alert, Badge, Button, Card, CardHeader, Field, Modal, Select, Textarea } from "./ui";

/** Profil de vulnérabilité : situations à confirmer, confirmées, levées. */
export function VulnerabilityPanel({ personId }: { personId: string }) {
  const { can } = useSession();
  const { data, mutate } = useApi<Paginated<Vulnerability>>(`vulnerabilities/?person=${personId}`);
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const manage = can("vulnerability.manage");
  const items = data?.results ?? [];
  const active = items.filter((v) => v.status !== "resolved");
  const resolved = items.filter((v) => v.status === "resolved");

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Action impossible.");
    }
  }

  const groups = new Map<string, Catalogs["vulnerabilities"]>();
  catalogs?.vulnerabilities.forEach((c) => groups.set(c.group_label, [...(groups.get(c.group_label) ?? []), c]));

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-danger" /> Situations de vulnérabilité
          </span>
        }
        subtitle="Déduites des enquêtes et des opérations, confirmées par un agent habilité."
        action={
          manage && (
            <Button variant="secondary" className="h-8 px-3" icon={<Plus className="size-3.5" />} onClick={() => setOpen(true)}>
              Ajouter
            </Button>
          )
        }
      />
      {error && (
        <div className="px-5 pt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {!active.length ? (
        <p className="px-5 py-6 text-sm text-muted">Aucune situation particulière enregistrée.</p>
      ) : (
        <ul className="divide-y divide-line">
          {active.map((v) => (
            <li key={v.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{v.label}</p>
                <p className="text-xs text-muted">
                  {v.group} · {v.source_label}
                  {v.operation_title && ` (${v.operation_title})`} · {formatDate(v.created_at)}
                </p>
                {v.notes && <p className="mt-1 text-xs">{v.notes}</p>}
              </div>
              <Badge tone={STATUS_TONE[v.status]}>{v.status_label}</Badge>
              {manage && (
                <span className="flex gap-1">
                  {v.status === "suspected" && (
                    <button title="Confirmer" className="rounded p-1 text-success hover:bg-success-50" onClick={() => run(() => api(`vulnerabilities/${v.id}/confirm/`, { method: "POST" }))}>
                      <Check className="size-4" />
                    </button>
                  )}
                  <button
                    title="Lever (la situation a pris fin ou était erronée)"
                    className="rounded p-1 text-muted hover:bg-navy-50"
                    onClick={() => run(() => api(`vulnerabilities/${v.id}/resolve/`, { method: "POST", json: { notes: "" } }))}
                  >
                    <X className="size-4" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {resolved.length > 0 && (
        <div className="border-t border-line px-5 py-2">
          <button className="text-xs font-medium text-teal-700 hover:underline" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? "Masquer" : "Voir"} l&apos;historique ({resolved.length} levée(s))
          </button>
          {showResolved && (
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {resolved.map((v) => (
                <li key={v.id}>
                  {v.label} — levée le {formatDate(v.created_at)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter une situation de vulnérabilité"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="accent"
              disabled={!category}
              onClick={() =>
                run(async () => {
                  await api("vulnerabilities/", { method: "POST", json: { person: personId, category, notes } });
                  setOpen(false);
                  setCategory("");
                  setNotes("");
                })
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <Field label="Situation" required>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">— Choisir —</option>
            {[...groups].map(([group, cats]) => (
              <optgroup key={group} label={group}>
                {cats.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                    {c.sensitive ? " (sensible)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Observation" hint="Faits constatés, sans détail intime inutile.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
        </Field>
        <p className="text-xs text-muted">Les situations sensibles (VBG, VIH, enfant au travail…) ne sont visibles que des rôles habilités.</p>
      </Modal>
    </Card>
  );
}

/** Aides apportées à la personne. */
export function AidPanel({ personId, personName }: { personId: string; personName: string }) {
  const { data, mutate } = useApi<Paginated<Assistance>>(`assistances/?person=${personId}`);
  const [open, setOpen] = useState(false);
  const delivered = (data?.results ?? []).filter((a) => a.status === "delivered");
  const total = delivered.reduce((s, a) => s + Number(a.amount ?? 0), 0);
  return (
    <Card>
      <CardHeader
        title="Aides reçues"
        subtitle={delivered.length ? `${delivered.length} aide(s) remise(s) · ${formatMoney(total)}` : "Historique complet des aides"}
        action={<AddAidButton onClick={() => setOpen(true)} />}
      />
      <AidList aids={data?.results} onChanged={() => mutate()} emptyText="Aucune aide enregistrée pour cette personne." />
      <AidModal
        open={open}
        onClose={() => setOpen(false)}
        personId={personId}
        personName={personName}
        onSaved={() => {
          setOpen(false);
          mutate();
        }}
      />
    </Card>
  );
}

/** Opérations (déguerpissement, sinistre, site minier…) dans lesquelles la personne est suivie. */
export function OperationCasesPanel({ personId }: { personId: string }) {
  const { can } = useSession();
  const { data } = useApi<Paginated<OperationCase>>(can("operation.view") ? `operation-cases/?person=${personId}` : null);
  if (!can("operation.view")) return null;
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Siren className="size-4 text-gold-600" /> Opérations et sinistres
          </span>
        }
      />
      {!data?.results.length ? (
        <p className="px-5 py-6 text-sm text-muted">Cette personne n&apos;est rattachée à aucune opération.</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.results.map((c) => (
            <li key={c.id} className="px-5 py-3 text-sm">
              <Link href={`/operations/${c.operation}`} className="font-semibold text-navy-900 hover:underline">
                {c.operation_title}
              </Link>
              <p className="text-xs text-muted">
                {c.operation_kind} · dossier {c.case_number}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge tone={STATUS_TONE[c.status]}>{c.status_label}</Badge>
                {c.lost_housing && <Badge tone="danger">Logement perdu</Badge>}
                {c.aid_summary.delivered === 0 && <Badge tone="warning">Sans aide</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
