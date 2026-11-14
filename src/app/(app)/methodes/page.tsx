import { Globe2 } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";

const REFERENCES = [
  {
    country: "Brésil",
    program: "Cadastro Único & Bolsa Família",
    idea: "Un registre social unique partagé par tous les programmes, mis à jour au moins tous les 2 ans.",
    here: "Registre unique des personnes et ménages, revisite signalée après 24 mois (Visites & agenda).",
  },
  {
    country: "Brésil · Chili",
    program: "SUAS / PAIF · Chile Solidario",
    idea: "Accompagnement familial par un référent, visites régulières, orientation vers les services publics.",
    here: "Comptes rendus de visite, évolution de la situation, orientations avec retour du service.",
  },
  {
    country: "Kenya",
    program: "Inua Jamii · Enhanced Single Registry",
    idea: "Mécanisme de plaintes accessible (ligne verte, comités locaux), délais de réponse suivis.",
    here: "Plaintes multicanal, références, délais selon la gravité, escalade et taux de réponse dans les délais.",
  },
  {
    country: "Philippines",
    program: "Pantawid 4Ps · Listahanan",
    idea: "Ciblage par score explicable, validation communautaire, traitement des réclamations d'exclusion.",
    here: "Score consultatif et expliqué, décision humaine motivée, recours et plaintes « exclusion ».",
  },
  {
    country: "Sénégal",
    program: "Registre National Unifié (RNU)",
    idea: "Registre national interopérable, utilisé par plusieurs ministères et partenaires.",
    here: "Organisations et structures partenaires, identifiants opaques, exports agrégés.",
  },
  {
    country: "Côte d'Ivoire",
    program: "RSU · Filets sociaux productifs · CMU",
    idea: "Ciblage des ménages pauvres, transferts monétaires, couverture maladie universelle.",
    here: "Orientations CMU et état civil, aides tracées avec preuve, situations de vulnérabilité ivoiriennes.",
  },
  {
    country: "Bangladesh · international",
    program: "Approche de « graduation » (BRAC)",
    idea: "Aide d'urgence, puis actif productif, formation et accompagnement jusqu'à l'autonomie.",
    here: "Programmes, formation, AGR, aides par étapes et suivi de l'évolution à chaque visite.",
  },
  {
    country: "Standards",
    program: "Banque mondiale (NES 5) · IASC · Sphère",
    idea: "Réinstallation involontaire, protection contre l'exploitation et les abus sexuels, normes humanitaires.",
    here: "Opérations de déguerpissement, indemnisations, plaintes EAS confidentielles, aides d'urgence.",
  },
];

const PRINCIPLES = [
  ["Ne pas nuire", "Aucune donnée sensible exposée sans habilitation ; plaintes EAS et fraude confidentielles."],
  ["Décision humaine", "Le score éclaire, il ne décide pas. Toute décision est motivée et peut faire l'objet d'un recours."],
  ["Redevabilité", "Chaque plainte reçoit une réponse écrite dans un délai connu ; chaque aide a une preuve."],
  ["Continuité", "Une orientation n'est close qu'avec le retour du service ; un ménage est revu régulièrement."],
  ["Minimisation", "Les cartes et indicateurs masquent les petits effectifs pour empêcher la ré-identification."],
];

export default function MethodsPage() {
  return (
    <>
      <PageHeader
        title="Méthodes & références"
        subtitle="Les fonctionnalités de LanfiaSave s'inspirent de programmes de protection sociale reconnus, adaptés au contexte ivoirien."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {REFERENCES.map((r) => (
          <Card key={r.program} className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-600">
              <Globe2 className="size-4" /> {r.country}
            </div>
            <p className="mt-2 font-semibold text-navy-900">{r.program}</p>
            <p className="mt-1 text-sm text-muted">{r.idea}</p>
            <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
              <b>Dans LanfiaSave :</b> {r.here}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader title="Nos principes de travail" />
        <ul className="divide-y divide-line">
          {PRINCIPLES.map(([t, d]) => (
            <li key={t} className="px-5 py-3 text-sm">
              <b className="text-ink">{t}.</b> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
