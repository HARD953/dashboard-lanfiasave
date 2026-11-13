"use client";

import { AlertTriangle, ClipboardCheck, FolderKanban, Scale, Users } from "lucide-react";
import Link from "next/link";
import { Alert, Badge, Card, CardHeader, PageHeader, Spinner, Stat } from "@/components/ui";
import { useApi } from "@/lib/api";
import { APPLICATION_STATUS, BANDS, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";

type Overview = {
  scope: { synthetic_data: boolean };
  persons: { total: number; provisional: number; women: number; by_status: Record<string, number> };
  households: number;
  programs: { active: number; total: number };
  applications: { total: number; by_status: Record<string, number> };
  decisions: Record<string, number>;
  appeals_open: number;
  score_bands: Record<string, number>;
  duplicates_open: number;
};

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink">{label}</span>
        <span className="tabular font-medium text-muted">
          {formatNumber(value)} <span className="text-soft">· {pct} %</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-navy-50">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { me, organizationId } = useSession();
  const { data, isLoading, error } = useApi<Overview>(organizationId ? `reports/overview/?organization=${organizationId}` : null);

  if (isLoading || !organizationId) return <Spinner />;
  if (error || !data) return <Alert tone="danger">{error?.message ?? "Indicateurs indisponibles."}</Alert>;

  const bandTotal = Object.values(data.score_bands).reduce((a, b) => a + b, 0);
  const appTotal = data.applications.total;
  const bandTone: Record<string, string> = {
    low: "bg-soft",
    medium: "bg-navy-700",
    high: "bg-gold-500",
    very_high: "bg-danger",
  };

  return (
    <>
      <PageHeader
        title={`Bonjour ${me?.full_name.split(" ")[0] ?? ""}`}
        subtitle="Indicateurs calculés en direct sur les données de votre organisation."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Personnes enregistrées"
          value={formatNumber(data.persons.total)}
          hint={`${formatNumber(data.households)} ménages · ${formatNumber(data.persons.women)} femmes`}
          icon={<Users className="size-5" />}
        />
        <Stat
          label="Programmes actifs"
          value={formatNumber(data.programs.active)}
          hint={`sur ${formatNumber(data.programs.total)} programmes`}
          icon={<FolderKanban className="size-5" />}
          accent="teal"
        />
        <Stat
          label="Candidatures en cours"
          value={formatNumber(appTotal - (data.applications.by_status.decided ?? 0) - (data.applications.by_status.withdrawn ?? 0))}
          hint={`${formatNumber(data.applications.by_status.committee ?? 0)} au comité`}
          icon={<ClipboardCheck className="size-5" />}
          accent="gold"
        />
        <Stat
          label="Recours ouverts"
          value={formatNumber(data.appeals_open)}
          hint="à traiter dans le délai de 30 jours"
          icon={<Scale className="size-5" />}
          accent={data.appeals_open ? "danger" : "navy"}
        />
      </div>

      {data.duplicates_open > 0 && (
        <div className="mt-6">
          <Alert tone="warning" title={`${data.duplicates_open} dossier(s) avec un doublon possible`}>
            Les doublons ne sont jamais fusionnés automatiquement : un superviseur doit les examiner.{" "}
            <Link href="/beneficiaires" className="font-semibold underline">
              Voir les dossiers
            </Link>
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Niveaux de vulnérabilité"
            subtitle="Dernier score consultatif par personne — n'emporte aucune décision."
          />
          <div className="space-y-4 p-5">
            {bandTotal === 0 ? (
              <p className="text-sm text-muted">Aucun score calculé pour l&apos;instant.</p>
            ) : (
              ["very_high", "high", "medium", "low"].map((b) => (
                <Bar key={b} label={BANDS[b].label} value={data.score_bands[b] ?? 0} total={bandTotal} tone={bandTone[b]} />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Avancement de l'instruction" subtitle={`${formatNumber(appTotal)} candidatures au total`} />
          <div className="space-y-4 p-5">
            {appTotal === 0 ? (
              <p className="text-sm text-muted">Aucune candidature.</p>
            ) : (
              ["submitted", "admissible", "under_review", "committee", "decided", "on_hold", "inadmissible"]
                .filter((s) => data.applications.by_status[s])
                .map((s) => (
                  <Bar
                    key={s}
                    label={APPLICATION_STATUS[s]}
                    value={data.applications.by_status[s]}
                    total={appTotal}
                    tone={s === "committee" ? "bg-gold-500" : s === "decided" ? "bg-success" : "bg-teal-600"}
                  />
                ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Décisions en vigueur" />
        <div className="flex flex-wrap gap-6 p-5">
          {(["approved", "rejected", "deferred"] as const).map((o) => (
            <div key={o} className="flex items-center gap-3">
              <Badge tone={o === "approved" ? "success" : o === "rejected" ? "danger" : "warning"}>
                {o === "approved" ? "Accordées" : o === "rejected" ? "Refusées" : "Ajournées"}
              </Badge>
              <span className="tabular text-xl font-bold text-navy-900">{formatNumber(data.decisions[o] ?? 0)}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted">
        <AlertTriangle className="size-3.5" />
        Source : base de données en direct. Les démonstrations utilisent exclusivement des dossiers synthétiques.
      </p>
    </>
  );
}
