"use client";

import { AlertOctagon, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Lock, TrendingDown, Users } from "lucide-react";
import Link from "next/link";
import { PhotoBanner } from "@/components/photo";
import { Alert, Badge, Card, CardHeader, EmptyState, Spinner, Stat, Table, Td, Th } from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import { GapList, pct, type PovertyReport } from "@/components/poverty";

function Meter({ value, tone = "bg-teal-600", title }: { value: number | null; tone?: string; title?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-navy-50" title={title}>
      <div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.min(100, value ?? 0)}%` }} />
    </div>
  );
}

function Series({ series }: { series: PovertyReport["series"] }) {
  const known = series.filter((s) => s.rate !== null);
  if (!known.length) return <p className="p-5 text-sm text-muted">Pas encore d&apos;évaluation datée.</p>;
  return (
    <div className="p-5">
      <div className="flex h-44 items-end gap-3 border-b border-line">
        {series.map((s) => (
          <div key={s.period} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            {s.rate !== null && (
              <>
                <span className="tabular mb-1 text-xs font-semibold text-ink">{pct(s.rate)}</span>
                <div className="w-full max-w-12 rounded-t bg-navy-700 transition group-hover:bg-teal-600" style={{ height: `${Math.max(2, s.rate)}%` }} />
                <span className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-navy-950 px-2 py-1 text-xs text-white group-hover:block">
                  {s.period} · {formatNumber(s.assessed)} ménages évalués · IPM {s.mpi ?? "—"}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {series.map((s) => (
          <span key={s.period} className="flex-1 text-center text-xs text-muted">
            {s.period}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Taux de pauvreté à la fin de chaque trimestre, d&apos;après la dernière évaluation connue de chaque ménage à cette date.</p>
    </div>
  );
}

export default function PovertyPage() {
  const { organizationId } = useSession();
  const { data, isLoading, error } = useApi<PovertyReport>(organizationId ? `reports/poverty/?organization=${organizationId}` : null);

  if (isLoading || !organizationId) return <Spinner />;
  if (error || !data) return <Alert tone="danger">{error?.message ?? "Indicateurs indisponibles."}</Alert>;
  const s = data.summary;
  const t = data.trajectories;
  const m = data.methodology;

  return (
    <>
      <PhotoBanner id="karite" eyebrow="Lutte contre la pauvreté" title="Qui est pauvre, de quoi manque-t-il, et qui en sort ?">
        Un indice à cinq dimensions calculé pour chaque ménage recensé, les besoins restés sans réponse, et le suivi des
        ménages dans le temps.
      </PhotoBanner>

      {s.assessed === 0 ? (
        <Card>
          <EmptyState icon={<Users className="size-5" />} title="Aucun ménage évalué pour l'instant">
            L&apos;indice se calcule dès que des questionnaires de recensement sont envoyés depuis l&apos;application Collecte.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Taux de pauvreté" value={pct(s.poverty_rate)} hint={`${formatNumber(s.poor)} ménages pauvres sur ${formatNumber(s.assessed)} évalués`} icon={<Users className="size-5" />} accent="danger" />
            <Stat label="Pauvreté sévère" value={pct(s.severe_rate)} hint={`${formatNumber(s.severe)} ménages privés de la moitié des besoins ou plus`} icon={<AlertOctagon className="size-5" />} accent="danger" />
            <Stat label="Indice de pauvreté (IPM)" value={s.mpi?.toFixed(3).replace(".", ",") ?? "—"} hint={`taux × intensité · intensité moyenne ${pct(s.intensity)}`} icon={<TrendingDown className="size-5" />} />
            <Stat label="Ménages pauvres aidés" value={pct(s.poor_coverage_rate)} hint={`${formatNumber(s.poor_covered)} ont reçu une aide en 12 mois`} icon={<CheckCircle2 className="size-5" />} accent="teal" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Sous le seuil de revenu" value={pct(s.monetary_poverty_rate)} hint={`moins de ${formatNumber(m.poverty_line_monthly)} FCFA par personne et par mois`} accent="gold" />
            <Stat label="Insécurité alimentaire" value={pct(s.food_insecurity_rate)} hint="moins de 2 repas par jour ou 3 jours sans assez à manger" accent="gold" />
            <Stat label="Besoins pris en charge" value={pct(s.response_rate)} hint={`${formatNumber(s.deprivations_handled)} sur ${formatNumber(s.deprivations_found)} privations constatées`} accent="teal" />
            <Stat label="Sorties de pauvreté" value={pct(t.exit_rate)} hint={`${formatNumber(t.exited)} ménages sortis sur ${formatNumber(t.exited + t.stayed_poor)} suivis`} accent="teal" />
          </div>
          {s.incomplete > 0 && (
            <p className="mt-3 text-xs text-muted">
              {formatNumber(s.incomplete)} ménage(s) non comptés : questionnaire trop incomplet pour calculer l&apos;indice (formulaire express, par exemple).
            </p>
          )}

          <Card className="mt-6">
            <CardHeader title="Problèmes à traiter" subtitle="Besoins constatés lors du recensement qui n'ont encore reçu ni aide ni orientation." />
            <GapList gaps={data.gaps} />
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Ce qui pèse le plus dans la pauvreté" subtitle="Part de chaque dimension dans l'indice : là où agir en priorité." />
              <div className="space-y-4 p-5">
                {[...data.dimensions]
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((d) => (
                    <div key={d.code}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-ink">{d.label}</span>
                        <span className="tabular font-medium text-muted">{pct(d.contribution)}</span>
                      </div>
                      <Meter value={d.contribution} tone="bg-gold-500" title={`${d.label} : ${pct(d.contribution)} de l'indice`} />
                    </div>
                  ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Évolution du taux de pauvreté" subtitle="Six derniers trimestres" />
              <Series series={data.series} />
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader title="Privations et réponses apportées" subtitle="Pour chaque besoin : combien de ménages en manquent, et combien ont reçu une aide ou une orientation adaptée en 12 mois." />
            <Table>
              <thead>
                <tr>
                  <Th>Privation</Th>
                  <Th className="text-right">Ménages privés</Th>
                  <Th className="w-40">Part</Th>
                  <Th className="text-right">Pris en charge</Th>
                  <Th className="text-right">Sans réponse</Th>
                  <Th>Réponse possible</Th>
                </tr>
              </thead>
              <tbody>
                {[...data.indicators]
                  .sort((a, b) => b.deprived - a.deprived)
                  .map((i) => (
                    <tr key={i.code}>
                      <Td className="font-medium text-ink">{i.label}</Td>
                      <Td className="tabular text-right">{i.answered ? formatNumber(i.deprived) : "—"}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Meter value={i.rate} tone="bg-navy-700" />
                          <span className="tabular w-14 shrink-0 text-right text-xs text-muted">{pct(i.rate)}</span>
                        </div>
                      </Td>
                      <Td className="tabular text-right">{i.responsive ? formatNumber(i.handled) : <span className="text-soft">—</span>}</Td>
                      <Td className="tabular text-right">
                        {i.responsive ? (i.unhandled ? <b className="text-danger">{formatNumber(i.unhandled)}</b> : "0") : <span className="text-soft">—</span>}
                      </Td>
                      <Td className="text-muted">{i.response}</Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            <p className="px-5 py-3 text-xs text-muted">« — » dans les réponses : besoin d&apos;infrastructure (eau, toilettes, électricité) qui relève des services techniques et des collectivités, pas d&apos;une aide individuelle.</p>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Pauvreté par localité" subtitle={`Localités de moins de ${data.min_cell} ménages évalués masquées.`} />
              <Table>
                <thead>
                  <tr>
                    <Th>Localité</Th>
                    <Th className="text-right">Évalués</Th>
                    <Th className="text-right">Taux</Th>
                    <Th className="text-right">IPM</Th>
                    <Th>Privation principale</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.territories.map((r) => (
                    <tr key={r.name}>
                      <Td className="font-medium text-ink">{r.name}</Td>
                      <Td className="tabular text-right">{formatNumber(r.assessed)}</Td>
                      <Td className="tabular text-right">
                        {r.suppressed ? (
                          <span className="inline-flex items-center gap-1 text-soft">
                            <Lock className="size-3" /> masqué
                          </span>
                        ) : (
                          <b className={(r.rate ?? 0) >= 50 ? "text-danger" : "text-ink"}>{pct(r.rate)}</b>
                        )}
                      </Td>
                      <Td className="tabular text-right">{r.suppressed ? "—" : r.mpi?.toFixed(2).replace(".", ",")}</Td>
                      <Td className="text-muted">{r.main_deprivation ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader title="Qui est le plus touché ?" subtitle="Taux de pauvreté selon le type de ménage" />
                <ul className="divide-y divide-line">
                  {data.groups.map((g) => (
                    <li key={g.label} className="px-5 py-3 text-sm">
                      <p className="font-medium text-ink">{g.label}</p>
                      <div className="mt-1 flex gap-6 text-muted">
                        <span>
                          Oui : <b className="tabular text-ink">{g.yes.suppressed ? "masqué" : pct(g.yes.rate)}</b>
                        </span>
                        <span>
                          Non : <b className="tabular text-ink">{g.no.suppressed ? "masqué" : pct(g.no.rate)}</b>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Trajectoires des ménages" subtitle={`${formatNumber(t.followed)} ménages évalués au moins deux fois`} />
                <div className="grid grid-cols-2 gap-px bg-line">
                  {[
                    { l: "Sortis de la pauvreté", v: t.exited, i: ArrowDownRight, c: "text-success" },
                    { l: "Tombés dans la pauvreté", v: t.entered, i: ArrowUpRight, c: "text-danger" },
                    { l: "Toujours pauvres", v: t.stayed_poor, i: AlertTriangle, c: "text-warning" },
                    { l: "Jamais pauvres", v: t.stayed_non_poor, i: CheckCircle2, c: "text-muted" },
                  ].map((x) => (
                    <div key={x.l} className="bg-white p-4">
                      <x.i className={`size-4 ${x.c}`} />
                      <p className="tabular mt-1 text-2xl font-bold text-navy-900">{formatNumber(x.v)}</p>
                      <p className="text-xs text-muted">{x.l}</p>
                    </div>
                  ))}
                </div>
                {t.avg_score_change !== null && (
                  <p className="px-5 py-3 text-xs text-muted">
                    Score de privation moyen : {t.avg_score_change > 0 ? "+" : ""}
                    {String(t.avg_score_change).replace(".", ",")} points entre la première et la dernière évaluation.
                  </p>
                )}
              </Card>
            </div>
          </div>

          {data.priority && (
            <Card className="mt-6" id="prioritaires">
              <CardHeader title="Ménages à prioriser" subtitle="Ménages pauvres classés par urgence : enfant malnutri, puis sans aucune aide, puis score de privation." />
              {data.priority.length === 0 ? (
                <p className="p-5 text-sm text-muted">Aucun ménage pauvre.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Ménage</Th>
                      <Th>Localité</Th>
                      <Th className="text-right">Privation</Th>
                      <Th>Besoins sans réponse</Th>
                      <Th>Dernière aide</Th>
                      <Th>Dernière visite</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.priority.map((p) => (
                      <tr key={p.household ?? p.code}>
                        <Td>
                          {p.head ? (
                            <Link href={`/beneficiaires/${p.head.id}`} className="font-semibold text-teal-700 hover:underline">
                              {p.head.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                          <p className="text-xs text-muted">{p.code}</p>
                        </Td>
                        <Td>{p.territory ?? "—"}</Td>
                        <Td className="text-right">
                          <Badge tone={p.severe ? "danger" : "warning"}>{p.score} %</Badge>
                        </Td>
                        <Td>
                          <div className="flex max-w-md flex-wrap gap-1">
                            {p.unhandled.length ? p.unhandled.map((u) => <Badge key={u}>{u}</Badge>) : <span className="text-xs text-muted">Tous pris en charge</span>}
                          </div>
                        </Td>
                        <Td>{p.last_aid ? formatDate(p.last_aid) : <b className="text-danger">Aucune</b>}</Td>
                        <Td>{p.last_visit ? formatDate(p.last_visit) : <span className="text-warning">Jamais</span>}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          )}
        </>
      )}

      <Card className="mt-6">
        <details className="group">
          <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-ink">
            Comment l&apos;indice est calculé <span className="text-sm font-normal text-muted">(cliquer pour voir)</span>
          </summary>
          <div className="space-y-4 border-t border-line px-5 py-4 text-sm text-muted">
            <p>
              Chaque ménage est évalué sur 5 dimensions de même poids (1/5). Le poids d&apos;une dimension est partagé entre ses
              indicateurs. Le score de privation est la somme des poids des besoins non couverts. Un ménage est <b className="text-ink">pauvre</b> à
              partir de {Math.round(m.poverty_cutoff * 100)} % et en <b className="text-ink">pauvreté sévère</b> à partir de {Math.round(m.severe_cutoff * 100)} %.
              L&apos;IPM multiplie le taux de pauvreté par l&apos;intensité moyenne des privations des ménages pauvres.
            </p>
            <p>
              Les réponses « Ne sait pas » ou « Refus » ne comptent pas comme des privations ; un ménage dont moins de la moitié des
              indicateurs est renseignée n&apos;est pas compté. Les questions sensibles (maladie, handicap, violences) ne sont jamais
              utilisées. Le seuil de revenu ({formatNumber(m.poverty_line_monthly)} FCFA par personne et par mois) est un paramètre à
              aligner sur le seuil national en vigueur.
            </p>
            <div className="grid gap-3 md:grid-cols-5">
              {m.dimensions.map((d) => (
                <div key={d.code} className="rounded-lg border border-line p-3">
                  <p className="font-semibold text-ink">{d.label}</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {d.indicators.map((i) => (
                      <li key={i.code}>
                        {i.label} <span className="text-soft">({Math.round(i.weight * 1000) / 10} %)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </details>
      </Card>
    </>
  );
}
