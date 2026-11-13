"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Program, Territory } from "@/lib/types";

const SECTORS = [
  ["safety_net", "Filets sociaux"],
  ["emergency", "Urgence / post-crise"],
  ["agriculture", "Agriculture"],
  ["digital", "Inclusion numérique"],
  ["training", "Formation et insertion"],
  ["csr", "RSE"],
  ["other", "Autre"],
];

export default function NewProgramPage() {
  const router = useRouter();
  const { organizationId } = useSession();
  const { data: territories } = useApi<Territory[]>("territories/?level=commune");
  const [f, setF] = useState({
    name: "",
    code: "",
    sector: "safety_net",
    description: "",
    eligibility_summary: "",
    funders: "",
    budget_amount: "",
    target_beneficiaries: "",
    start_date: "",
    end_date: "",
    territories: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const p = await api<Program>("programs/", {
        method: "POST",
        json: {
          ...f,
          organization: organizationId,
          code: f.code || slug(f.name),
          budget_amount: f.budget_amount || null,
          target_beneficiaries: f.target_beneficiaries || null,
          start_date: f.start_date || null,
          end_date: f.end_date || null,
        },
      });
      router.push(`/programmes/${p.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.readable : "Création impossible.");
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Nouveau programme" subtitle="Le programme est créé en brouillon." back={{ href: "/programmes", label: "Programmes" }} />
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        {error && <Alert tone="danger">{error}</Alert>}
        <Card>
          <CardHeader title="Description" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nom du programme" required>
                <Input value={f.name} onChange={set("name")} required />
              </Field>
            </div>
            <Field label="Code" hint="Généré à partir du nom si vide">
              <Input value={f.code} onChange={set("code")} placeholder={slug(f.name)} />
            </Field>
            <Field label="Secteur">
              <Select value={f.sector} onChange={set("sector")}>
                {SECTORS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Objectifs et description">
                <Textarea value={f.description} onChange={set("description")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Critères d'éligibilité publiés" hint="En langage clair : ils seront communiqués aux bénéficiaires.">
                <Textarea value={f.eligibility_summary} onChange={set("eligibility_summary")} />
              </Field>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Cadrage" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Financeur(s)">
              <Input value={f.funders} onChange={set("funders")} />
            </Field>
            <Field label="Budget (FCFA)">
              <Input type="number" min={0} value={f.budget_amount} onChange={set("budget_amount")} />
            </Field>
            <Field label="Objectif indicatif de bénéficiaires">
              <Input type="number" min={0} value={f.target_beneficiaries} onChange={set("target_beneficiaries")} />
            </Field>
            <div />
            <Field label="Début">
              <Input type="date" value={f.start_date} onChange={set("start_date")} />
            </Field>
            <Field label="Fin">
              <Input type="date" value={f.end_date} onChange={set("end_date")} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Territoires couverts</p>
              <div className="flex flex-wrap gap-2">
                {territories?.map((t) => {
                  const on = f.territories.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() =>
                        setF({ ...f, territories: on ? f.territories.filter((x) => x !== t.id) : [...f.territories, t.id] })
                      }
                      className={`rounded-full border px-3 py-1 text-sm ${on ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white hover:bg-navy-50"}`}
                      aria-pressed={on}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" variant="accent" loading={saving}>
            Créer le programme
          </Button>
        </div>
      </form>
    </>
  );
}

function slug(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
