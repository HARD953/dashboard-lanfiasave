import { BarChart3, ClipboardList, HandCoins, MessageSquareWarning, Route, Scale, Target, Users } from "lucide-react";
import { Photo, PhotoBanner } from "@/components/photo";
import { Card, CardHeader } from "@/components/ui";

const STEPS = [
  {
    icon: Users,
    title: "Identifier les ménages",
    problem: "Beaucoup de ménages pauvres ne sont connus d'aucun service : pas de papiers, pas de téléphone, habitat informel.",
    how: "Recensement terrain hors connexion, sans pièce d'identité exigée, avec trois formulaires selon l'urgence (express, standard, complet).",
  },
  {
    icon: BarChart3,
    title: "Mesurer la pauvreté",
    problem: "Le revenu seul ne dit pas tout : un ménage peut manger à sa faim mais n'avoir ni école, ni CMU, ni acte de naissance.",
    how: "Indice à 5 dimensions (revenus, alimentation, logement, éducation, santé et état civil) calculé pour chaque ménage, avec taux, intensité et IPM.",
  },
  {
    icon: Scale,
    title: "Décider avec équité",
    problem: "Des listes faites à la main laissent de côté des ménages et exposent à la fraude et au favoritisme.",
    how: "Score consultatif et expliqué, décision humaine motivée en comité, droit de recours ; part des aides qui vont aux ménages pauvres suivie.",
  },
  {
    icon: HandCoins,
    title: "Apporter l'aide et la prouver",
    problem: "Les aides promises n'arrivent pas toujours, et personne ne peut le vérifier.",
    how: "Chaque aide est rattachée à une structure, une date et une preuve (reçu, n° de transaction mobile money).",
  },
  {
    icon: Route,
    title: "Orienter vers les services",
    problem: "Un enfant sans acte de naissance ne passera pas l'examen ; un ménage sans CMU s'endette au premier soin.",
    how: "Orientations vers l'état civil, l'ONECI, la CMU, l'école, les centres de santé, l'AEJ ; une orientation n'est close qu'avec le retour du service.",
  },
  {
    icon: ClipboardList,
    title: "Suivre dans la durée",
    problem: "Une aide ponctuelle ne fait pas sortir de la pauvreté ; sans suivi, on ne sait pas si la situation change.",
    how: "Visites régulières, réévaluation au moins tous les 24 mois, trajectoires : ménages sortis, tombés ou restés dans la pauvreté.",
  },
  {
    icon: MessageSquareWarning,
    title: "Écouter les personnes",
    problem: "Les personnes aidées n'osent pas se plaindre, surtout en cas d'abus ou de demande d'argent.",
    how: "Plaintes depuis l'app Mon Parcours, par téléphone ou au guichet ; délais de 3, 10 ou 30 jours selon la gravité ; avis de la personne sur la réponse.",
  },
  {
    icon: Target,
    title: "Rendre compte",
    problem: "Les bailleurs et l'État demandent des résultats, pas seulement des activités.",
    how: "Cadre de suivi de 19 indicateurs (impact, effets, mise en œuvre, redevabilité), avec valeur de référence et cible pour chacun.",
  },
];

const PRINCIPLES = [
  ["Ne pas nuire", "Aucune donnée sensible exposée sans habilitation ; plaintes d'abus et de fraude confidentielles."],
  ["Décision humaine", "Le score éclaire, il ne décide pas. Toute décision est motivée et peut faire l'objet d'un recours."],
  ["Redevabilité", "Chaque plainte reçoit une réponse écrite dans un délai connu ; chaque aide a une preuve."],
  ["Continuité", "Une orientation n'est close qu'avec le retour du service ; un ménage est revu régulièrement."],
  ["Minimisation", "Les cartes et indicateurs masquent les petits effectifs pour empêcher la ré-identification."],
];

export default function MethodsPage() {
  return (
    <>
      <PhotoBanner id="village" eyebrow="Méthodes" title="À quel problème répond chaque fonction">
        LanfiaSave part des difficultés concrètes rencontrées sur le terrain en Côte d&apos;Ivoire, de l&apos;identification
        des ménages jusqu&apos;à la sortie de la pauvreté.
      </PhotoBanner>
      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <Card key={s.title} className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <s.icon className="size-5" />
              </span>
              <span className="text-xs font-semibold text-gold-600">0{i + 1}</span>
              <p className="font-semibold text-navy-900">{s.title}</p>
            </div>
            <p className="mt-3 text-sm text-muted">
              <b className="text-ink">Le problème :</b> {s.problem}
            </p>
            <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
              <b>Dans LanfiaSave :</b> {s.how}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Photo id="ecole" className="min-h-64 rounded-card" />
        <Card>
          <CardHeader title="Nos principes de travail" />
          <ul className="divide-y divide-line">
            {PRINCIPLES.map(([t, d]) => (
              <li key={t} className="px-5 py-3 text-sm">
                <b className="text-ink">{t}.</b> <span className="text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
