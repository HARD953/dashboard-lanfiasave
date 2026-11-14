"use client";

import { ArrowDown, ArrowUp, Pencil, Target } from "lucide-react";
import { useState } from "react";
import { PhotoBanner } from "@/components/photo";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Modal, Spinner } from "@/components/ui";
import { ApiError, api, useApi } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";

type IndicatorRow = {
  code: string;
  level: "impact" | "outcome" | "output" | "accountability";
  label: string;
  definition: string;
  unit: "%" | "indice" | "jours";
  direction: "up" | "down";
  frequency: string;
  source: string;
  disaggregation: string;
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  target: { baseline: string | null; target: string; deadline: string | null; note: string } | null;
  status: "no_target" | "no_data" | "achieved" | "in_progress" | "off_track";
  progress: number | null;
};
type Framework = { levels: Record<string, string>; indicators: IndicatorRow[]; can_edit_targets: boolean };

const STATUS: Record<IndicatorRow["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  achieved: { label: "Cible atteinte", tone: "success" },
  in_progress: { label: "En progrès", tone: "info" },
  off_track: { label: "Se dégrade", tone: "danger" },
  no_data: { label: "Pas encore de données", tone: "neutral" },
  no_target: { label: "Cible à fixer", tone: "warning" },
};

function fmt(v: number | string | null | undefined, unit: IndicatorRow["unit"]) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (unit === "indice") return n.toFixed(3).replace(".", ",");
  const s = (Math.round(n * 10) / 10).toString().replace(".", ",");
  return unit === "%" ? `${s} %` : `${s} j`;
}

function TargetModal({ row, organizationId, onClose, onSaved }: { row: IndicatorRow; organizationId: string; onClose: () => void; onSaved: () => void }) {
  const [baseline, setBaseline] = useState(row.target?.baseline ?? (row.value !== null ? String(row.value) : ""));
  const [target, setTarget] = useState(row.target?.target ?? "");
  const [deadline, setDeadline] = useState(row.target?.deadline ?? "");
  const [note, setNote] = useState(row.target?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(remove = false) {
    setSaving(true);
    setError(null);
    try {
      await api("reports/indicators/targets/", {
        method: "POST",
        json: {
          organization: organizationId,
          code: row.code,
          baseline: remove || baseline === "" ? null : baseline.replace(",", "."),
          target: remove || target === "" ? null : target.replace(",", "."),
          deadline: remove || !deadline ? null : deadline,
          note,
        },
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={row.label}
      footer={
        <>
          {row.target && (
            <Button variant="ghost" onClick={() => save(true)} disabled={saving}>
              Retirer la cible
            </Button>
          )}
          <Button onClick={() => save()} loading={saving} disabled={target === ""}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">{row.definition}</p>
        <p className="text-sm">
          Valeur actuelle : <b className="tabular text-ink">{fmt(row.value, row.unit)}</b> · objectif :{" "}
          {row.direction === "down" ? "faire baisser" : "faire monter"}
        </p>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valeur de référence" hint="Situation de départ (souvent la valeur actuelle)">
            <Input inputMode="decimal" value={baseline} onChange={(e) => setBaseline(e.target.value)} className="h-10" />
          </Field>
          <Field label="Cible" required>
            <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="h-10" />
          </Field>
          <Field label="Échéance">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-10" />
          </Field>
          <Field label="Note" hint="Ex. : cible du cadre de résultats du programme">
            <Input value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} className="h-10" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default function IndicatorsPage() {
  const { organizationId } = useSession();
  const { data, error, isLoading, mutate } = useApi<Framework>(organizationId ? `reports/indicators/?organization=${organizationId}` : null);
  const [editing, setEditing] = useState<IndicatorRow | null>(null);

  if (isLoading || !organizationId) return <Spinner />;
  if (error || !data) return <Alert tone="danger">{error?.message ?? "Indicateurs indisponibles."}</Alert>;

  const counts = data.indicators.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});

  return (
    <>
      <PhotoBanner id="maraichage" eyebrow="Cadre de suivi" title="Les indicateurs qui disent si la pauvreté recule">
        {data.indicators.length} indicateurs calculés en direct, de l&apos;impact sur les ménages jusqu&apos;à l&apos;écoute des
        plaintes. Fixez une valeur de référence et une cible pour chacun, comme dans un cadre de résultats.
      </PhotoBanner>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["achieved", "in_progress", "off_track", "no_target"] as const).map((s) => (
          <Badge key={s} tone={STATUS[s].tone}>
            {STATUS[s].label} : {counts[s] ?? 0}
          </Badge>
        ))}
      </div>

      {(Object.keys(data.levels) as IndicatorRow["level"][]).map((level) => (
        <Card key={level} className="mb-6">
          <CardHeader title={data.levels[level]} />
          <ul className="divide-y divide-line">
            {data.indicators
              .filter((r) => r.level === level)
              .map((r) => {
                const st = STATUS[r.status];
                return (
                  <li key={r.code} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.6fr_0.7fr_1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        {r.label}
                        <span title={r.direction === "down" ? "Doit baisser" : "Doit monter"} className="text-soft">
                          {r.direction === "down" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{r.definition}</p>
                      <p className="mt-1 text-xs text-soft">
                        {r.frequency} · Source : {r.source} · Ventilation : {r.disaggregation}
                      </p>
                    </div>
                    <div>
                      <p className="tabular text-2xl font-bold text-navy-900">{fmt(r.value, r.unit)}</p>
                      {r.denominator !== null && (
                        <p className="text-xs text-muted">
                          {r.numerator !== null ? `${formatNumber(r.numerator)} / ` : "sur "}
                          {formatNumber(r.denominator)}
                        </p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {r.target && (
                        <>
                          <p className="mt-1.5 text-xs text-muted">
                            <Target className="mr-1 inline size-3" />
                            Réf. {fmt(r.target.baseline, r.unit)} → cible <b className="text-ink">{fmt(r.target.target, r.unit)}</b>
                            {r.target.deadline && ` d'ici le ${formatDate(r.target.deadline)}`}
                          </p>
                          {r.progress !== null && (
                            <div className="mt-1.5 h-1.5 rounded-full bg-navy-50" title={`${r.progress} % du chemin parcouru`}>
                              <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${r.progress}%` }} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {data.can_edit_targets ? (
                      <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditing(r)}>
                        {r.target ? "Modifier" : "Fixer la cible"}
                      </Button>
                    ) : (
                      <span />
                    )}
                  </li>
                );
              })}
          </ul>
        </Card>
      ))}

      <p className="text-xs text-muted">
        Les valeurs sont recalculées à chaque ouverture de la page à partir des données de votre organisation. Seuls les
        responsables de programme et les administrateurs peuvent fixer les cibles ; chaque modification est journalisée.
      </p>

      {editing && <TargetModal row={editing} organizationId={organizationId} onClose={() => setEditing(null)} onSaved={() => mutate()} />}
    </>
  );
}
