"use client";

import { Lock, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useClaimsMeta } from "@/components/claims";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td, Textarea, Th } from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";

type Report = {
  id: string;
  reference: string;
  kind: string;
  kind_label: string;
  description: string;
  reporter_name: string;
  reporter_phone: string;
  identity_on_file?: boolean;
  consent_disclosure: boolean;
  status: string;
  status_label: string;
  due_at: string;
  is_priority: boolean;
  is_overdue: boolean;
  prefect_notified_at: string | null;
  followup_1m_due: string | null;
  followup_1m_done_at: string | null;
  followup_3m_due: string | null;
  followup_3m_done_at: string | null;
  resolution: string;
  claim_reference: string | null;
  created_at: string;
};

function FileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { organizationId } = useSession();
  const { data: meta } = useClaimsMeta();
  const [f, setF] = useState({ kind: "operator", channel: "phone", description: "", reporter_name: "", reporter_phone: "" });
  const [done, setDone] = useState<{ reference: string; is_priority: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function save() {
    setError(null);
    try {
      setDone(await api("protected-reports/", { method: "POST", json: { ...f, organization: organizationId } }));
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    }
  }
  const close = () => {
    setDone(null);
    setF({ kind: "operator", channel: "phone", description: "", reporter_name: "", reporter_phone: "" });
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title="Plainte confidentielle" footer={done ? <Button onClick={close}>Fermer</Button> : <Button onClick={save} disabled={f.description.length < 5}>Transmettre au membre indépendant</Button>}>
      {done ? (
        <Alert tone="success" title={`Référence ${done.reference}`}>
          Plainte transmise au membre indépendant de la commission de recours. {done.is_priority ? "Traitement sous 72 heures." : "Réponse sous 15 jours."} Vous ne verrez plus son contenu.
        </Alert>
      ) : (
        <>
          <p className="text-sm text-muted">Canal séparé, hors de la chaîne du promoteur. L&apos;identité n&apos;est levée qu&apos;avec l&apos;accord écrit du plaignant. Toute aide liée au retrait d&apos;une plainte est interdite et signalée au préfet.</p>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Nature"><Select value={f.kind} onChange={set("kind")}>{meta?.protected_kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</Select></Field>
          <Field label="Canal"><Select value={f.channel} onChange={set("channel")}>{meta?.channels.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</Select></Field>
          <Field label="Ce qui est signalé" required><Textarea value={f.description} onChange={set("description")} /></Field>
          <Field label="Nom (facultatif)" hint="Masqué pour tous, sauf accord écrit"><Input value={f.reporter_name} onChange={set("reporter_name")} /></Field>
          <Field label="Téléphone (facultatif)"><Input value={f.reporter_phone} onChange={set("reporter_phone")} /></Field>
        </>
      )}
    </Modal>
  );
}

function Handle({ r, onClose, onDone }: { r: Report; onClose: () => void; onDone: () => void }) {
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function post(json: Record<string, unknown>) {
    setError(null);
    try {
      await api(`protected-reports/${r.id}/update_status/`, { method: "POST", json });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Action impossible.");
    }
  }
  return (
    <Modal open onClose={onClose} title={`${r.reference} — ${r.kind_label}`}>
      {error && <Alert tone="danger">{error}</Alert>}
      <p className="text-sm">{r.description}</p>
      <p className="text-xs text-muted">Plaignant : {r.consent_disclosure ? `${r.reporter_name} ${r.reporter_phone}` : r.identity_on_file ? "identité masquée (pas d'accord écrit)" : "anonyme"}</p>
      {r.prefect_notified_at && <Alert tone="warning">Aide conditionnée au retrait d&apos;une plainte : signalée au préfet le {formatDate(r.prefect_notified_at)}.</Alert>}
      <div className="flex flex-wrap gap-2">
        {r.status === "received" && <Button variant="secondary" onClick={() => post({ status: "investigating" })}>Prendre en charge</Button>}
        {r.followup_1m_due && !r.followup_1m_done_at && <Button variant="secondary" onClick={() => post({ followup: "1m" })}>Revue à 1 mois faite</Button>}
        {r.followup_3m_due && !r.followup_3m_done_at && <Button variant="secondary" onClick={() => post({ followup: "3m" })}>Revue à 3 mois faite</Button>}
        {!r.consent_disclosure && r.identity_on_file && <Button variant="secondary" onClick={() => post({ consent_disclosure: true })}>Accord écrit de lever l&apos;identité reçu</Button>}
      </div>
      {!["resolved", "closed"].includes(r.status) && (
        <>
          <Field label="Réponse écrite"><Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} /></Field>
          <Button onClick={() => post({ status: "resolved", resolution })} disabled={resolution.length < 10}>Marquer traitée</Button>
        </>
      )}
      {r.resolution && <p className="text-sm text-muted">Réponse : {r.resolution}</p>}
    </Modal>
  );
}

export default function ProtectedPage() {
  const { organizationId, can } = useSession();
  const [filing, setFiling] = useState(false);
  const [current, setCurrent] = useState<Report | null>(null);
  const viewer = can("protected.view");
  const { data, mutate, isLoading } = useApi<Paginated<Report>>(viewer && organizationId ? `protected-reports/?organization=${organizationId}` : null);
  return (
    <>
      <PageHeader
        title="Plaintes confidentielles et représailles"
        subtitle="Plaintes visant le promoteur, un sous-traitant, une autorité locale ou un relais, traitées hors de la chaîne du promoteut par le membre indépendant de la commission de recours."
        actions={can("protected.file") && <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setFiling(true)}>Enregistrer une plainte</Button>}
      />
      {!viewer ? (
        <Card className="p-8">
          <EmptyState icon={<Lock className="size-5" />} title="Contenu réservé au membre indépendant">
            Vous pouvez enregistrer une plainte confidentielle ; seule sa référence vous est remise.
          </EmptyState>
        </Card>
      ) : isLoading ? (
        <Spinner />
      ) : (
        <Card>
          <CardHeader title="Registre confidentiel" subtitle="Représailles, aide conditionnée et abus : 72 heures ; autres plaintes : 15 jours. Représailles revues à 1 et 3 mois." />
          {!data?.results.length ? (
            <EmptyState icon={<ShieldAlert className="size-5" />} title="Aucune plainte" />
          ) : (
            <Table>
              <thead><tr><Th>Référence</Th><Th>Nature</Th><Th>Échéance</Th><Th>Revues</Th><Th>Statut</Th></tr></thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-navy-50" onClick={() => setCurrent(r)}>
                    <Td className="font-mono text-xs">{r.reference}{r.is_priority && <span className="ml-2"><Badge tone="danger">72 h</Badge></span>}</Td>
                    <Td className="text-sm">{r.kind_label}{r.claim_reference && <span className="block text-xs text-muted">Dossier {r.claim_reference}</span>}</Td>
                    <Td className={r.is_overdue ? "font-semibold text-danger" : "text-sm"}>{formatDate(r.due_at, true)}</Td>
                    <Td className="text-xs text-muted">{r.followup_1m_due ? `1 mois : ${r.followup_1m_done_at ? "faite" : formatDate(r.followup_1m_due)} · 3 mois : ${r.followup_3m_done_at ? "faite" : formatDate(r.followup_3m_due)}` : "—"}</Td>
                    <Td><Badge tone={["resolved", "closed"].includes(r.status) ? "success" : r.is_overdue ? "danger" : "gold"}>{r.status_label}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
      <FileModal open={filing} onClose={() => { setFiling(false); mutate(); }} />
      {current && <Handle r={current} onClose={() => setCurrent(null)} onDone={() => { setCurrent(null); mutate(); }} />}
    </>
  );
}
