import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  HandCoins,
  HandHeart,
  Landmark,
  LineChart,
  Lock,
  MapPinned,
  MessageSquareWarning,
  Route,
  ShieldCheck,
  Siren,
  Smartphone,
  Sprout,
  Users,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { Photo } from "@/components/photo";

const STEPS = [
  { icon: Users, title: "Identifier", text: "Recensement des ménages, même sans pièce d'identité ni téléphone, avec un formulaire adapté à chaque situation." },
  { icon: ShieldCheck, title: "Décider", text: "Score explicable et consultatif, décision humaine motivée, recours accessible." },
  { icon: HandCoins, title: "Protéger", text: "Aides tracées de la source de financement à la preuve de remise." },
  { icon: Route, title: "Orienter", text: "Vers l'état civil, la CMU, l'école, la santé, l'aide juridique, avec retour du service." },
  { icon: GraduationCap, title: "Autonomiser", text: "Formation, activités génératrices de revenus, accompagnement jusqu'à l'autonomie." },
  { icon: LineChart, title: "Rendre compte", text: "Indicateurs par localité, plaintes traitées dans les délais, journal d'audit." },
];

const AUDIENCES = [
  { icon: Landmark, title: "Ministères & agences", text: "Suivre les populations touchées par les déguerpissements, catastrophes et grands projets." },
  { icon: Building2, title: "Collectivités", text: "Connaître les besoins de chaque quartier et coordonner les intervenants." },
  { icon: HandHeart, title: "ONG & fondations", text: "Cibler avec équité, accompagner et prouver l'impact auprès des bailleurs." },
  { icon: Sprout, title: "Entreprises (RSE, mines)", text: "Gérer la réinstallation et les indemnisations selon les standards internationaux." },
];

const POVERTY_PILLARS = [
  { photo: "plantation" as const, title: "Mesurer", text: "Un indice à 5 dimensions par ménage : revenus, alimentation, logement, éducation, santé et état civil." },
  { photo: "karite" as const, title: "Agir là où ça compte", text: "Les besoins sans réponse sont listés : faim, enfants non scolarisés, absence de CMU ou d'acte de naissance." },
  { photo: "ecole" as const, title: "Suivre qui en sort", text: "Chaque ménage est réévalué : on voit qui sort de la pauvreté, qui y tombe, et pourquoi." },
];

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-600" />
      <span>{children}</span>
    </li>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] rounded-[2.4rem] border-[10px] border-navy-950 bg-navy-950 shadow-2xl">
      <div className="overflow-hidden rounded-[1.7rem] bg-canvas">
        <div className="bg-navy-900 px-4 pb-4 pt-6 text-white">
          <p className="text-[10px] text-white/60">Étape 3 sur 11 · Formulaire Express</p>
          <p className="mt-1 text-sm font-bold">Logement et biens</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/15">
            <div className="h-1.5 w-1/3 rounded-full bg-teal-500" />
          </div>
        </div>
        <div className="space-y-2.5 p-3">
          <p className="text-[11px] font-semibold text-ink">Le ménage a-t-il perdu son logement ?</p>
          {["Oui, totalement", "Oui, en partie", "Non"].map((o, i) => (
            <div key={o} className={`rounded-xl border px-3 py-2.5 text-[11px] font-medium ${i === 0 ? "border-teal-600 bg-teal-50 text-teal-700" : "border-line bg-white text-ink"}`}>
              {o}
            </div>
          ))}
          <div className="flex gap-1.5 pt-1">
            {["Ne sait pas", "Refus", "N/A"].map((o) => (
              <span key={o} className="rounded-full bg-navy-50 px-2 py-1 text-[9px] text-muted">{o}</span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-warning-50 px-3 py-2 text-[10px] text-warning">
            <WifiOff className="size-3.5" /> Hors connexion — envoi automatique plus tard
          </div>
          <div className="rounded-xl bg-teal-600 py-2.5 text-center text-[11px] font-bold text-white">Continuer</div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const bars = [72, 48, 90, 35, 60, 82, 44];
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-danger/60" />
        <span className="size-2.5 rounded-full bg-gold-500/70" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <span className="ml-3 text-[11px] text-muted">Tableau de bord · Organisation</span>
      </div>
      <div className="grid grid-cols-[120px_1fr]">
        <div className="space-y-1.5 bg-navy-900 p-3">
          {["Tableau de bord", "Carte", "Bénéficiaires", "Opérations", "Visites", "Plaintes"].map((l, i) => (
            <div key={l} className={`rounded-md px-2 py-1.5 text-[10px] ${i === 0 ? "bg-white/10 text-white" : "text-white/55"}`}>{l}</div>
          ))}
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Personnes suivies", "1 248"],
              ["Aides remises", "3 902"],
              ["Plaintes dans les délais", "94 %"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-line p-2.5">
                <p className="text-[9px] text-muted">{l}</p>
                <p className="tabular mt-1 text-base font-bold text-navy-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-[10px] font-semibold text-ink">Personnes vulnérables par localité</p>
            <div className="mt-3 flex h-24 items-end gap-2">
              {bars.map((h, i) => (
                <div key={i} className={`flex-1 rounded-t ${h > 80 ? "bg-danger" : h > 55 ? "bg-gold-500" : "bg-teal-500"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-[10px] text-danger">
            <BellRing className="size-3.5" /> 3 visites en retard · 2 plaintes à traiter en priorité
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#plateforme" className="hover:text-navy-900">Plateforme</a>
            <a href="#terrain" className="hover:text-navy-900">Terrain</a>
            <a href="#crises" className="hover:text-navy-900">Crises & déguerpissements</a>
            <a href="#pauvrete" className="hover:text-navy-900">Pauvreté</a>
          </nav>
          <Link href="/connexion" className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800">
            Espace professionnel <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Héros */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-teal-600/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-gold-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-500">
              Protection sociale · Côte d&apos;Ivoire
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Ne laisser <span className="text-teal-500">personne</span> sans suivi, de l&apos;identification à l&apos;autonomie.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              LanfiaSave réunit sur une même plateforme le recensement terrain, les dossiers des personnes affectées par
              les déguerpissements, catastrophes et sites miniers, les aides apportées, les orientations et les plaintes.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/connexion" className="inline-flex h-12 items-center gap-2 rounded-lg bg-teal-600 px-6 font-semibold text-white hover:bg-teal-700">
                Accéder à la plateforme <ArrowRight className="size-4" />
              </Link>
              <a href="#plateforme" className="inline-flex h-12 items-center rounded-lg border border-white/20 px-6 font-semibold text-white hover:bg-white/5">
                Découvrir
              </a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["31", "situations de vulnérabilité suivies"],
                ["3", "formulaires selon l'urgence"],
                ["100 %", "des aides avec preuve"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-bold text-white">{v}</dt>
                  <dd className="mt-1 text-xs text-white/60">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <Image src="/illustrations/terrain.svg" alt="Une agente recenseuse avec une tablette rencontre une mère et son enfant devant leur maison" width={560} height={460} priority className="h-auto w-full drop-shadow-2xl" />
            <div className="absolute -bottom-4 -left-2 hidden items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xl sm:flex">
              <span className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-700"><WifiOff className="size-4" /></span>
              <span className="text-xs"><b className="block text-sm text-ink">Fonctionne sans réseau</b><span className="text-muted">envoi automatique au retour</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Pour qui */}
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-navy-800 shadow-sm"><a.icon className="size-5" /></span>
              <div>
                <p className="font-semibold text-ink">{a.title}</p>
                <p className="mt-1 text-sm text-muted">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parcours */}
      <section id="plateforme" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">La plateforme</p>
        <h2 className="mt-2 text-3xl font-bold text-navy-900">Un parcours complet et traçable</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Chaque étape est journalisée, chaque décision est motivée et chaque aide est rattachée à une structure et à une preuve.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-card border border-line p-6 transition hover:border-teal-500 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700"><s.icon className="size-5" /></span>
                <span className="text-xs font-semibold text-gold-600">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terrain */}
      <section id="terrain" className="scroll-mt-20 bg-teal-50/60">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2">
          <PhoneMockup />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Application Collecte</p>
            <h2 className="mt-2 text-3xl font-bold text-navy-900">Sur le terrain, même sans réseau</h2>
            <p className="mt-3 text-muted">Pensée pour des agents qui travaillent en plein soleil, loin d&apos;une connexion, avec des publics parfois peu à l&apos;aise.</p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              <Check>Trois formulaires : Express (5 min) en urgence, Standard, ou Complet pour une évaluation approfondie.</Check>
              <Check>Aucune pièce d&apos;identité exigée ; « Ne sait pas » et « Refus » toujours possibles.</Check>
              <Check>Brouillon sauvegardé à chaque saisie, envoi automatique et sans doublon au retour du réseau.</Check>
              <Check>Les bénéficiaires suivent leur dossier et leurs aides avec l&apos;application <b>Mon Parcours</b>.</Check>
            </ul>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-teal-700">
              <Smartphone className="size-4" /> Android et iPhone
            </div>
          </div>
        </div>
      </section>

      {/* Crises */}
      <section id="crises" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-14 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Opérations & sinistres</p>
          <h2 className="mt-2 text-3xl font-bold text-navy-900">Personne n&apos;est perdu de vue après un déguerpissement</h2>
          <p className="mt-3 text-muted">
            Déguerpissements, inondations, éboulements, incendies, sites miniers : un dossier est ouvert pour chaque personne affectée,
            quelle que soit la structure à l&apos;origine de l&apos;action.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Siren, t: "Dossiers par opération", d: "Besoins, logement perdu, site de relogement, indemnisation due." },
              { icon: HandHeart, t: "Aides avec preuve", d: "Qui a donné quoi, à qui, quand, avec reçu ou n° de transaction." },
              { icon: CalendarCheck, t: "Visites de suivi", d: "Évolution de la situation, prochaine visite, alertes de retard." },
              { icon: MessageSquareWarning, t: "Plaintes & réclamations", d: "Référence, délai de réponse, escalade, plaintes anonymes protégées." },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-line p-4">
                <x.icon className="size-5 text-teal-700" />
                <p className="mt-2 text-sm font-semibold text-ink">{x.t}</p>
                <p className="mt-1 text-xs text-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
        <Image src="/illustrations/aide.svg" alt="Remise d'un kit d'aide à une famille sur un site d'accueil, avec reçu signé" width={520} height={400} className="h-auto w-full rounded-[2rem] shadow-xl" />
      </section>

      {/* Pilotage */}
      <section className="bg-navy-900">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2">
          <div className="space-y-6">
            <DashboardMockup />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500">Pilotage</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Voir où sont les besoins, et rendre compte</h2>
            <p className="mt-3 text-white/70">
              Indicateurs en temps réel, carte des vulnérabilités par localité, délais de traitement des plaintes, aides remises
              par structure : de quoi décider vite et justifier chaque franc auprès des bailleurs.
            </p>
            <div className="mt-8 flex items-center gap-5">
              <Image src="/illustrations/carte.svg" alt="Carte stylisée des localités avec les zones prioritaires" width={520} height={400} className="h-auto w-56 rounded-2xl shadow-lg" />
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2"><MapPinned className="size-4 text-teal-500" /> Zones prioritaires</li>
                <li className="flex items-center gap-2"><Lock className="size-4 text-teal-500" /> Petits effectifs masqués</li>
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-teal-500" /> Journal d&apos;audit inaltérable</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Lutte contre la pauvreté */}
      <section id="pauvrete" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Lutte contre la pauvreté</p>
            <h2 className="mt-2 text-3xl font-bold text-navy-900">Savoir si la pauvreté recule, ménage par ménage</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Aider ne suffit pas : il faut savoir qui est pauvre, de quoi il manque, si l&apos;aide arrive aux bonnes personnes et
              si leur situation s&apos;améliore. LanfiaSave le calcule en direct, avec un cadre de 19 indicateurs de suivi.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4">
            {[
              ["5", "dimensions de la pauvreté"],
              ["19", "indicateurs de suivi"],
              ["8", "alertes de besoins non couverts"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-card border border-line p-4">
                <dt className="text-2xl font-bold text-navy-900">{v}</dt>
                <dd className="mt-1 text-xs text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {POVERTY_PILLARS.map((p) => (
            <div key={p.title} className="overflow-hidden rounded-card border border-line bg-white">
              <Photo id={p.photo} className="h-52" />
              <div className="p-5">
                <h3 className="font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="px-6 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-teal-600 px-8 py-12 sm:px-12">
          <div className="absolute -right-10 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Prêts à mieux protéger les personnes vulnérables ?</h2>
              <p className="mt-2 text-white/85">Les comptes sont créés par l&apos;administrateur de votre organisation.</p>
            </div>
            <Link href="/connexion" className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-teal-700 hover:bg-teal-50">
              Se connecter <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-muted">
          <span>© 2026 LanfiaTech — LanfiaSave</span>
          <span>Aucune donnée individuelle n&apos;est publiée sur ce site. Photos : Wikimedia Commons (licences libres, auteur indiqué sur chaque photo) ; les personnes photographiées ne sont pas des bénéficiaires.</span>
        </div>
      </footer>
    </div>
  );
}
