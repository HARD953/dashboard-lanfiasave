import { ArrowRight, GraduationCap, HandCoins, LineChart, ShieldCheck, Sprout, Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand";

const STEPS = [
  { icon: Users, title: "Identifier", text: "Recensement des ménages, même sans pièce d'identité ni téléphone." },
  { icon: ShieldCheck, title: "Décider", text: "Score explicable et consultatif, décision humaine motivée, recours." },
  { icon: HandCoins, title: "Protéger", text: "Aides tracées de la source de financement à la preuve de remise." },
  { icon: GraduationCap, title: "Former", text: "Parcours de formation, présences, acquis et attestations vérifiables." },
  { icon: Sprout, title: "Entreprendre", text: "Projets AGR accompagnés : plan d'affaires, jalons, suivi d'activité." },
  { icon: LineChart, title: "Mesurer", text: "Résultats à 3, 6 et 12 mois, sans attribution causale abusive." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link
          href="/connexion"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Espace professionnel <ArrowRight className="size-4" />
        </Link>
      </header>

      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-teal-600/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <p className="mb-4 inline-flex rounded-full border border-gold-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-500">
            Protection sociale · Formation · Inclusion économique
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Accompagner chaque personne vulnérable, de l&apos;identification à l&apos;autonomie.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75">
            LanfiaSave est la plateforme des ONG, fondations, collectivités et programmes RSE pour identifier avec
            équité, décider avec responsabilité, former, financer via des partenaires habilités et mesurer les
            progrès.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/connexion"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-teal-600 px-6 font-semibold text-white hover:bg-teal-700"
            >
              Accéder à la plateforme <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold text-navy-900">Un parcours complet et traçable</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Chaque étape est journalisée, chaque décision est motivée et chaque franc est rattaché à une source et à
          une preuve.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-card border border-line p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <s.icon className="size-5" />
                </span>
                <span className="text-xs font-semibold text-gold-600">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-muted">
          <span>© {2026} LanfiaTech — LanfiaSave</span>
          <span>Aucune donnée individuelle n&apos;est publiée sur ce site.</span>
        </div>
      </footer>
    </div>
  );
}
