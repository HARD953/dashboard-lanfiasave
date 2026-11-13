"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Person, Territory } from "@/lib/types";

export default function NewPersonPage() {
  const router = useRouter();
  const { organizationId } = useSession();
  const { data: territories } = useApi<Territory[]>("territories/?level=commune");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    usual_name: "",
    sex: "U",
    estimated_age: "",
    phone: "",
    language: "",
    territory: "",
    residence_status: "",
    has_identity_document: false,
    enrollment_context: "standard",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const person = await api<Person>("persons/", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        json: {
          ...form,
          organization: organizationId,
          estimated_age: form.estimated_age ? Number(form.estimated_age) : null,
          territory: form.territory || null,
        },
      });
      router.push(`/beneficiaires/${person.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.readable : "Enregistrement impossible.");
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nouveau dossier"
        subtitle="Aucune pièce d'identité n'est exigée : un identifiant provisoire est attribué automatiquement."
        back={{ href: "/beneficiaires", label: "Bénéficiaires" }}
      />
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        {error && <Alert tone="danger">{error}</Alert>}
        <Card>
          <CardHeader title="Identité déclarée" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Prénom(s)" required>
              <Input value={form.first_name} onChange={set("first_name")} required />
            </Field>
            <Field label="Nom">
              <Input value={form.last_name} onChange={set("last_name")} />
            </Field>
            <Field label="Nom d'usage" hint="Nom par lequel la personne est connue localement">
              <Input value={form.usual_name} onChange={set("usual_name")} />
            </Field>
            <Field label="Sexe">
              <Select value={form.sex} onChange={set("sex")}>
                <option value="F">Femme</option>
                <option value="M">Homme</option>
                <option value="U">Non déclaré</option>
              </Select>
            </Field>
            <Field label="Âge estimé" hint="Laisser vide si inconnu">
              <Input type="number" min={0} max={120} value={form.estimated_age} onChange={set("estimated_age")} />
            </Field>
            <Field label="Langue parlée">
              <Input value={form.language} onChange={set("language")} placeholder="Dioula, baoulé, français…" />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Contact et résidence" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Téléphone" hint="Facultatif — la personne peut ne pas avoir de téléphone">
              <Input inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="07 07 00 00 00" />
            </Field>
            <Field label="Commune">
              <Select value={form.territory} onChange={set("territory")}>
                <option value="">— Non renseignée —</option>
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Situation de résidence">
              <Select value={form.residence_status} onChange={set("residence_status")}>
                <option value="">— Non renseignée —</option>
                <option value="resident">Résident</option>
                <option value="displaced">Déplacé</option>
                <option value="returnee">Retourné</option>
                <option value="refugee">Réfugié</option>
                <option value="unknown">Inconnu</option>
              </Select>
            </Field>
            <Field label="Contexte d'enrôlement">
              <Select value={form.enrollment_context} onChange={set("enrollment_context")}>
                <option value="standard">Standard</option>
                <option value="emergency">Urgence (catastrophe, déguerpissement)</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.has_identity_document} onChange={set("has_identity_document")} className="size-4 accent-teal-600" />
              La personne possède une pièce d&apos;identité
            </label>
          </div>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" variant="accent" loading={saving}>
            Créer le dossier
          </Button>
        </div>
      </form>
    </>
  );
}
