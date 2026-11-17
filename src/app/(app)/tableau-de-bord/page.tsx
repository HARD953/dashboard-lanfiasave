"use client";

import { AlertTriangle, ArrowRight, ClipboardCheck, FolderKanban, HandHeart, Scale, Siren, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor } from "@/components/app-shell";
import { PhotoBanner } from "@/components/photo";
import { GapList, pct, type PovertyReport } from "@/components/poverty";
import { Alert, Badge, Card, CardHeader, Spinner, Stat } from "@/components/ui";
import { useApi } from "@/lib/api";
import { APPLICATION_STATUS, BANDS, formatMoney, formatNumber } from "@/lib/format";
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
  vulnerabilities: { code: string; label: string; persons: number }[];
  operations: { active: number; total: number; affected_persons: number; affected_without_aid: number; lost_contact: number };
  assistance: { delivered: number; planned: number; delivered_amount: number; persons_helped: number };
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
  const { me, organizationId, can, isPlatformAdmin } = useSession();
  const router = useRouter();
  const allowed = can("report.aggregate");
  // Ministère, payeur, relais, exploitant : leur page d'accueil est celle de leur rôle.
  useEffect(() => {
    if (me && organizationId && !allowed) router.replace(homeFor(can, isPlatformAdmin));
  }, [me, organizationId, allowed, can, isPlatformAdmin, router]);
  const { data, isLoading, error } = useApi<Overview>(allowed && organizationId ? `reports/overview/?organization=${organizationId}` : null);
  const { data: poverty } = useApi<PovertyReport>(allowed && organizationId ? `reports/poverty/?organization=${organizationId}` : null);
  if (!allowed) return <Spinner />;

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
      <PhotoBanner id="marche" eyebrow="Tableau de bord" title={`Bonjour ${me?.full_name.split(" ")[0] ?? ""}`}>
        Où en est la lutte contre la pauvreté dans votre zone, et quels besoins attendent encore une réponse.
        Indicateurs calculés en direct sur les données de votre organisation.
      </PhotoBanner>

      {poverty && poverty.summary.assessed > 0 && (
        <Card className="mb-6">
          <CardHeader
            title="Lutte contre la pauvreté"
            subtitle={`${formatNumber(poverty.summary.assessed)} ménages évalués avec l'indice à 5 dimensions`}
            action={
              <Link href="/pauvrete" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
                Analyse complète <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-px border-b border-line bg-line lg:grid-cols-4">
            {[
              ["Ménages pauvres", pct(poverty.summary.poverty_rate), `${formatNumber(poverty.summary.poor)} ménages`],
              ["Pauvreté sévère", pct(poverty.summary.severe_rate), `${formatNumber(poverty.summary.severe)} ménages`],
              ["Pauvres ayant reçu une aide", pct(poverty.summary.poor_coverage_rate), "sur les 12 derniers mois"],
              ["Sorties de pauvreté", pct(poverty.trajectories.exit_rate), `${formatNumber(poverty.trajectories.exited)} ménages réévalués`],
            ].map(([l, v, h]) => (
              <div key={l} className="bg-white px-5 py-4">
                <p className="text-sm text-muted">{l}</p>
                <p className="tabular mt-1 text-2xl font-bold text-navy-900">{v}</p>
                <p className="text-xs text-muted">{h}</p>
              </div>
            ))}
          </div>
          <p className="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted">Problèmes à traiter en priorité</p>
          <GapList gaps={poverty.gaps} limit={4} />
        </Card>
      )}

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

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Opérations en cours"
          value={formatNumber(data.operations.active)}
          hint="déguerpissements, sinistres, sites miniers…"
          icon={<Siren className="size-5" />}
          accent="danger"
        />
        <Stat
          label="Personnes affectées suivies"
          value={formatNumber(data.operations.affected_persons)}
          hint={`${formatNumber(data.operations.affected_without_aid)} encore sans aucune aide`}
          icon={<Users className="size-5" />}
          accent={data.operations.affected_without_aid ? "danger" : "teal"}
        />
        <Stat
          label="Aides remises"
          value={formatNumber(data.assistance.delivered)}
          hint={`${formatNumber(data.assistance.persons_helped)} personnes aidées · ${formatNumber(data.assistance.planned)} planifiées`}
          icon={<HandHeart className="size-5" />}
          accent="teal"
        />
        <Stat
          label="Valeur des aides remises"
          value={formatMoney(data.assistance.delivered_amount)}
          icon={<HandHeart className="size-5" />}
          accent="gold"
        />
      </div>

      {data.operations.lost_contact > 0 && (
        <div className="mt-6">
          <Alert tone="danger" title={`${data.operations.lost_contact} personne(s) affectée(s) perdue(s) de vue`}>
            <Link href="/operations" className="font-semibold underline">
              Voir les opérations
            </Link>
          </Alert>
        </div>
      )}

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

      {data.vulnerabilities.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Situations de vulnérabilité les plus fréquentes" subtitle="Personnes concernées (hors catégories sensibles)." />
          <div className="grid gap-x-8 gap-y-4 p-5 md:grid-cols-2">
            {data.vulnerabilities.map((v) => (
              <Bar key={v.code} label={v.label} value={v.persons} total={data.persons.total} tone="bg-navy-700" />
            ))}
          </div>
        </Card>
      )}

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
