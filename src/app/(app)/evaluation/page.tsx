"use client";

import { Dices } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Spinner } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";

type Sample = { id: string; created_at: string; seed: string; note: string; claims: { id: string; reference: string; status: string }[] };

export default function EvaluationPage() {
  const { organizationId, can } = useSession();
  const { data, mutate, isLoading } = useApi<Sample[]>("evaluation/samples/");
  const [size, setSize] = useState("20");
  const [error, setError] = useState<string | null>(null);
  async function draw() {
    setError(null);
    try {
      await api("evaluation/samples/", { method: "POST", json: { organization: organizationId, size: Number(size) } });
      mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Tirage impossible.");
    }
  }
  return (
    <>
      <PageHeader title="Évaluation indépendante" subtitle="Audit d'un échantillon de dossiers, de décisions et de paiements tiré au sort. Chaque consultation est journalisée ; l'évaluateur n'intervient dans aucune décision." />
      {can("claim.evaluate") && (
        <Card className="mb-6 p-5">
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Taille de l'échantillon"><Input inputMode="numeric" value={size} onChange={(e) => setSize(e.target.value)} className="w-32" /></Field>
            <Button icon={<Dices className="size-4" />} onClick={draw}>Tirer au sort</Button>
          </div>
        </Card>
      )}
      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <Card className="p-8"><EmptyState icon={<Dices className="size-5" />} title="Aucun échantillon tiré" /></Card>
      ) : (
        data.map((s) => (
          <Card key={s.id} className="mb-4">
            <CardHeader title={`Échantillon du ${formatDate(s.created_at, true)}`} subtitle={`${s.claims.length} dossiers · graine ${s.seed}`} />
            <ul className="grid gap-2 p-5 sm:grid-cols-3 lg:grid-cols-4">
              {s.claims.map((c) => (
                <li key={c.id}><Link href={`/demandes/${c.id}`} className="font-mono text-sm text-teal-700 hover:underline">{c.reference}</Link> <span className="text-xs text-muted">{c.status}</span></li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </>
  );
}
