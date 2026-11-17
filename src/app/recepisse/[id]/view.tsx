"use client";

import { Printer } from "lucide-react";
import { Logo } from "@/components/brand";
import { useApi } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Receipt = {
  reference: string;
  claimant_name: string;
  village: string;
  territory: string;
  registered_at: string;
  channel: string;
  impacts: string[];
  language: string;
  decision_due: string;
  urgent: boolean;
  organization: string;
  recorded_by: string;
};

/** Récépissé papier remis au ménage et lu à voix haute dans sa langue. */
export default function Receipt({ id }: { id: string }) {
  const { data: r, error } = useApi<Receipt>(`claims/${id}/receipt/`);
  if (error) return <p className="p-8 text-danger">Récépissé indisponible.</p>;
  if (!r) return <p className="p-8">Chargement…</p>;
  return (
    <main className="mx-auto max-w-2xl bg-white p-8 text-ink print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">Imprimez deux exemplaires : un pour le ménage, un pour le dossier.</p>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white">
          <Printer className="size-4" /> Imprimer
        </button>
      </div>
      <section className="rounded-xl border-2 border-navy-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <div className="text-right text-xs text-muted">{r.organization}</div>
        </div>
        <h1 className="mt-6 text-xl font-bold">Récépissé de demande</h1>
        <p className="mt-1 text-sm text-muted">Dispositif d&apos;accompagnement des ménages affectés par les activités minières, pétrolières et énergétiques</p>
        <div className="my-6 rounded-lg bg-navy-50 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">Numéro de dossier</p>
          <p className="font-mono text-3xl font-bold tracking-wider">{r.reference}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-muted">Nom</dt><dd className="font-medium">{r.claimant_name}</dd>
          <dt className="text-muted">Village</dt><dd>{[r.village, r.territory].filter(Boolean).join(", ") || "—"}</dd>
          <dt className="text-muted">Enregistrée le</dt><dd>{formatDate(r.registered_at, true)}</dd>
          <dt className="text-muted">Par</dt><dd>{r.channel}{r.recorded_by ? ` — ${r.recorded_by}` : ""}</dd>
          <dt className="text-muted">Objet</dt><dd>{r.impacts.join(" ; ") || "—"}</dd>
        </dl>
        <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <p><b>Vous recevrez une décision motivée au plus tard le {formatDate(r.decision_due)}.</b></p>
          {r.urgent && <p>Votre situation a été signalée comme urgente : une mesure doit être prise sous 72 heures.</p>}
          <p>Vous pourrez contester la décision pendant 30 jours devant une commission de recours qui comprend un membre indépendant.</p>
          <p>Pour suivre votre dossier : adressez-vous à votre relais ou à la permanence du village, ou envoyez par SMS « SUIVI {r.reference} ».</p>
          <p>Ce récépissé ne remplace aucun droit : l&apos;indemnisation, les recours administratifs et judiciaires restent ouverts, que vous soyez inscrit ou non.</p>
          <p className="text-muted">Aucune somme ne peut vous être demandée pour cette démarche. Toute demande d&apos;argent ou pression peut être signalée de façon confidentielle.</p>
        </div>
        {r.language && <p className="mt-4 text-xs text-muted">Récépissé lu à voix haute en {r.language}.</p>}
        <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-muted">
          <p className="border-t border-line pt-2">Signature ou empreinte du demandeur</p>
          <p className="border-t border-line pt-2">Signature de l&apos;agent ou du relais</p>
        </div>
      </section>
    </main>
  );
}
