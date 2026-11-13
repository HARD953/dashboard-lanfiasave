"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Alert, Button, Card, Field, Input } from "./ui";

/** Écran imposé tant que l'utilisateur garde un mot de passe provisoire. */
export function ChangePasswordGate() {
  const { me, refresh } = useSession();
  const [oldPwd, setOld] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    setError(null);
    try {
      await api("auth/change-password/", { method: "POST", json: { old_password: oldPwd, new_password: pwd } });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.readable : "Changement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-gold-100 text-gold-600">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-navy-900">Choisissez votre mot de passe</h1>
            <p className="text-sm text-muted">Bienvenue {me?.full_name}. Remplacez le mot de passe provisoire.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Mot de passe provisoire" required>
            <Input type="password" autoComplete="current-password" value={oldPwd} onChange={(e) => setOld(e.target.value)} required />
          </Field>
          <Field label="Nouveau mot de passe" hint="10 caractères minimum, pas uniquement des chiffres." required>
            <Input type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          </Field>
          <Field label="Confirmez le nouveau mot de passe" required>
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" loading={busy}>
            Enregistrer et continuer
          </Button>
        </form>
      </Card>
    </div>
  );
}
