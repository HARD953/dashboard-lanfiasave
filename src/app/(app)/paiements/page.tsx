"use client";

import { Download, Wallet } from "lucide-react";
import { useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td, Th } from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { useSession } from "@/lib/session";

type Payment = { id: string; reference: string; beneficiary: string; phone: string; village: string; amount: string; delivery_channel: string; channel_label: string; status: string; delivered_at: string | null; delivery_proof: string; validated_at: string | null };

export default function PaymentsPage() {
  const { can } = useSession();
  const [status, setStatus] = useState("planned");
  const { data, mutate, isLoading } = useApi<Paginated<Payment>>(`claim-payments/?status=${status}`);
  const [current, setCurrent] = useState<Payment | null>(null);
  const [proof, setProof] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!current) return;
    setError(null);
    try {
      await api(`claim-payments/${current.id}/confirm/`, { method: "POST", json: { proof } });
      setCurrent(null);
      setProof("");
      mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Confirmation impossible.");
    }
  }
  async function exportCsv() {
    const r = await api<{ filename: string; content: string }>("claim-payments/export/");
    const url = URL.createObjectURL(new Blob([r.content], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: r.filename });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Paiements validés"
        subtitle="Le payeur voit l'identité, le montant validé et le moyen de paiement — jamais le contenu de la demande. Chaque remise est confirmée avec sa preuve."
        actions={can("claim.pay") && <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>Ordre de paiement (CSV)</Button>}
      />
      <Card>
        <div className="border-b border-line p-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-60" aria-label="Statut">
            <option value="planned">À payer</option>
            <option value="delivered">Payés</option>
          </Select>
        </div>
        {isLoading ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<Wallet className="size-5" />} title="Aucun paiement dans cette vue" />
        ) : (
          <Table>
            <thead><tr><Th>Dossier</Th><Th>Bénéficiaire</Th><Th>Montant</Th><Th>Moyen</Th><Th>Validé le</Th><Th>État</Th></tr></thead>
            <tbody>
              {data.results.map((p) => (
                <tr key={p.id}>
                  <Td className="font-mono text-xs">{p.reference}</Td>
                  <Td><span className="font-medium text-ink">{p.beneficiary}</span><span className="block text-xs text-muted">{p.village} {p.phone && `· ${p.phone}`}</span></Td>
                  <Td className="tabular">{formatMoney(p.amount)}</Td>
                  <Td className="text-sm">{p.channel_label}</Td>
                  <Td className="text-sm">{formatDate(p.validated_at)}</Td>
                  <Td>
                    {p.status === "delivered" ? (
                      <Badge tone="success">Payé le {formatDate(p.delivered_at)}</Badge>
                    ) : can("claim.pay") ? (
                      <Button variant="accent" onClick={() => setCurrent(p)}>Confirmer le paiement</Button>
                    ) : (
                      <Badge tone="gold">À payer</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {current && (
        <Modal open onClose={() => setCurrent(null)} title={`Paiement ${current.reference}`} footer={<Button onClick={confirm} disabled={!proof}>Confirmer</Button>}>
          {error && <Alert tone="danger">{error}</Alert>}
          <p className="text-sm">{current.beneficiary} · {formatMoney(current.amount)} · {current.channel_label}</p>
          <Field label="Preuve" hint="N° de transaction mobile money ou n° du reçu signé" required><Input value={proof} onChange={(e) => setProof(e.target.value)} /></Field>
        </Modal>
      )}
    </>
  );
}
