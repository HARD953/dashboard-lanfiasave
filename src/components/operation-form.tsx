"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Catalogs, Operation, Partner, Territory } from "@/lib/types";

export function OperationFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Operation }) {
  const router = useRouter();
  const { organizationId } = useSession();
  const { data: catalogs } = useApi<Catalogs>(open ? "catalogs/" : null);
  const { data: partners } = useApi<Partner[]>(open && organizationId ? `partners/?organization=${organizationId}` : null);
  const { data: territories } = useApi<Territory[]>(open ? "territories/" : null);
  const [f, setF] = useState(() => ({
    title: initial?.title ?? "",
    kind: initial?.kind ?? "eviction",
    initiated_by: initial?.initiated_by ?? "",
    partners: initial?.partners ?? ([] as string[]),
    territory: initial?.territory ?? "",
    sites: initial?.sites ?? "",
    legal_reference: initial?.legal_reference ?? "",
    notice_date: initial?.notice_date ?? "",
    start_date: initial?.start_date ?? "",
    estimated_households: initial?.estimated_households?.toString() ?? "",
    compensation_policy: initial?.compensation_policy ?? "",
    compensation_amount_per_household: initial?.compensation_amount_per_household ?? "",
    description: initial?.description ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError(null);
    const json = {
      ...f,
      organization: organizationId,
      initiated_by: f.initiated_by || null,
      territory: f.territory || null,
      notice_date: f.notice_date || null,
      start_date: f.start_date || null,
      estimated_households: f.estimated_households || null,
      compensation_amount_per_household: f.compensation_amount_per_household || null,
    };
    try {
      if (initial) {
        await api(`operations/${initial.id}/`, { method: "PATCH", json });
        onClose();
      } else {
        const op = await api<Operation>("operations/", { method: "POST", json });
        router.push(`/operations/${op.id}`);
      }
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
      title={initial ? "Modifier l'opération" : "Nouvelle opération"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="accent" loading={busy} disabled={!f.title} onClick={submit}>
            {initial ? "Enregistrer" : "Ouvrir l'opération"}
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Intitulé" hint="Ex. Déguerpissement du quartier X, Inondations de juin à Abobo" required>
            <Input value={f.title} onChange={set("title")} />
          </Field>
        </div>
        <Field label="Nature" required>
          <Select value={f.kind} onChange={set("kind")}>
            {catalogs?.operation_kinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Déclenchée par" hint="Structure à l'origine (gouvernement, mairie, mine…)">
          <Select value={f.initiated_by} onChange={set("initiated_by")}>
            <option value="">— Non renseignée —</option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Territoire">
          <Select value={f.territory} onChange={set("territory")}>
            <option value="">— Non renseigné —</option>
            {territories?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quartiers / sites touchés">
          <Input value={f.sites} onChange={set("sites")} />
        </Field>
        <Field label="Date du préavis">
          <Input type="date" value={f.notice_date} onChange={set("notice_date")} />
        </Field>
        <Field label="Date de début">
          <Input type="date" value={f.start_date} onChange={set("start_date")} />
        </Field>
        <Field label="Ménages estimés">
          <Input type="number" min={0} value={f.estimated_households} onChange={set("estimated_households")} />
        </Field>
        <Field label="Référence officielle" hint="Arrêté, décision, plan de réinstallation…">
          <Input value={f.legal_reference} onChange={set("legal_reference")} />
        </Field>
        <Field label="Indemnité annoncée par ménage (FCFA)">
          <Input type="number" min={0} value={f.compensation_amount_per_household} onChange={set("compensation_amount_per_household")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Mesures d'accompagnement annoncées">
            <Textarea value={f.compensation_policy} onChange={set("compensation_policy")} className="min-h-16" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Structures qui interviennent</p>
          <div className="flex flex-wrap gap-2">
            {partners?.map((p) => {
              const on = f.partners.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setF({ ...f, partners: on ? f.partners.filter((x) => x !== p.id) : [...f.partners, p.id] })}
                  className={`rounded-full border px-3 py-1 text-sm ${on ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white hover:bg-navy-50"}`}
                  aria-pressed={on}
                >
                  {p.acronym || p.name}
                </button>
              );
            })}
            {!partners?.length && <span className="text-xs text-muted">Ajoutez des structures dans Administration → Structures.</span>}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea value={f.description} onChange={set("description")} className="min-h-16" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
