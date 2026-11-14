"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Alert, Button, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          res.status === 429
            ? "Trop de tentatives. Patientez une minute avant de réessayer."
            : data?.error?.message ?? "Connexion impossible.",
        );
        return;
      }
      const next = new URLSearchParams(window.location.search).get("suite");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/tableau-de-bord";
    } catch {
      setError("Le service est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-teal-600/25 blur-3xl" aria-hidden />
        <Logo light />
        <Image
          src="/illustrations/terrain.svg"
          alt=""
          width={560}
          height={460}
          priority
          className="relative mx-auto h-auto w-full max-w-md drop-shadow-2xl"
        />
        <div className="relative">
          <p className="text-3xl font-bold leading-snug text-white">
            Identifier avec équité.
            <br />
            Décider avec responsabilité.
            <br />
            <span className="text-teal-500">Accompagner jusqu&apos;à l&apos;autonomie.</span>
          </p>
          <p className="mt-6 max-w-md text-sm text-white/60">
            Accès réservé aux équipes habilitées. Toutes les actions sont journalisées.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Connexion</h1>
            <p className="mt-1 text-sm text-muted">Espace des professionnels LanfiaSave</p>
          </div>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Identifiant" required>
            <Input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </Field>
          <Field label="Mot de passe" required>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading} icon={<Lock className="size-4" />}>
            Se connecter
          </Button>
          <p className="text-center text-xs text-muted">
            Problème d&apos;accès ? Contactez l&apos;administrateur de votre organisation.
          </p>
        </form>
      </div>
    </div>
  );
}
