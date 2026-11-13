"use client";

import { BookCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  DefinitionList,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Spinner,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { BANDS, PROGRAM_TRANSITIONS, STATUS_TONE, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Application, Program } from "@/lib/types";

type Rule = { id: string; version: number; effective_from: string; description: string; created_at: string };

export default function ProgramDetailPage({ id }: { id: string }) {
  const { can } = useSession();
  const { data: p, mutate, error } = useApi<Program>(`programs/${id}/`);
  const { data: rules, mutate: mutateRules } = useApi<Rule[]>(`programs/${id}/rules/`);
  const { data: apps } = useApi<Paginated<Application>>(can("application.view") ? `applications/?program=${id}` : null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleText, setRuleText] = useState("");

  if (error) return <Alert tone="danger">{error.status === 404 ? "Programme introuvable ou hors de votre périmètre." : error.message}</Alert>;
  if (!p) return <Spinner />;

  async function transition(to: string) {
    setBusy(to);
    setFeedback(null);
    try {
      await api(`programs/${id}/transition/`, { method: "POST", json: { to } });
      await mutate();
      setFeedback({ tone: "success", text: "Statut du programme mis à jour." });
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Action impossible." });
    } finally {
      setBusy(null);
    }
  }

  async function addRule() {
    setBusy("rule");
    try {
      await api(`programs/${id}/rules/`, { method: "POST", json: { description: ruleText, rules: {} } });
      setRuleOpen(false);
      setRuleText("");
      await Promise.all([mutateRules(), mutate()]);
      setFeedback({ tone: "success", text: "Nouvelle version de règle publiée. Les dossiers antérieurs gardent leur règle." });
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Publication impossible." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        back={{ href: "/programmes", label: "Programmes" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {p.name} <Badge tone={STATUS_TONE[p.status]}>{p.status_label}</Badge>
          </span>
        }
        subtitle={`${p.sector_label} · code ${p.code}`}
        actions={
          can("program.manage") &&
          PROGRAM_TRANSITIONS[p.status]?.map((t) => (
            <Button
              key={t.to}
              variant={["suspended", "closed", "draft", "archived"].includes(t.to) ? "secondary" : "primary"}
              loading={busy === t.to}
              onClick={() => transition(t.to)}
            >
              {t.label}
            </Button>
          ))
        }
      />
      {feedback && (
        <div className="mb-4">
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Présentation" />
            <div className="space-y-5 p-5">
              {p.description && <p className="text-sm leading-relaxed">{p.description}</p>}
              <DefinitionList
                items={[
                  { label: "Financeur(s)", value: p.funders },
                  { label: "Budget", value: formatMoney(p.budget_amount, p.currency) },
                  { label: "Objectif indicatif", value: p.target_beneficiaries ? `${formatNumber(p.target_beneficiaries)} bénéficiaires` : "—" },
                  { label: "Période", value: `${formatDate(p.start_date)} → ${formatDate(p.end_date)}` },
                ]}
              />
              {p.eligibility_summary && (
                <div className="rounded-lg bg-navy-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Critères publiés</p>
                  <p className="mt-1 text-sm">{p.eligibility_summary}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Candidatures" subtitle={`${formatNumber(apps?.count ?? 0)} au total`} />
            {!apps?.results.length ? (
              <p className="px-5 py-6 text-sm text-muted">Aucune candidature pour ce programme.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Personne</Th>
                    <Th>Score consultatif</Th>
                    <Th>Statut</Th>
                    <Th>Déposée le</Th>
                  </tr>
                </thead>
                <tbody>
                  {apps.results.map((a) => (
                    <tr key={a.id} className="hover:bg-navy-50/50">
                      <Td>
                        <Link href={`/instruction/${a.id}`} className="font-semibold text-navy-900 hover:text-teal-700">
                          {a.person_name}
                        </Link>
                        <p className="font-mono text-xs text-muted">{a.person_code}</p>
                      </Td>
                      <Td>
                        {a.score_summary ? (
                          <Badge tone={BANDS[a.score_summary.band]?.tone}>{a.score_summary.total}/100</Badge>
                        ) : (
                          <span className="text-xs text-soft">—</span>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[a.status]}>{a.status_label}</Badge>
                      </Td>
                      <Td className="text-muted">{formatDate(a.created_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader
            title="Règles d'éligibilité"
            subtitle="Versionnées : un dossier est toujours relu avec la règle en vigueur à sa date."
            action={
              can("program.manage") && (
                <Button variant="secondary" className="h-8 px-3" icon={<Plus className="size-3.5" />} onClick={() => setRuleOpen(true)}>
                  Version
                </Button>
              )
            }
          />
          {!rules?.length ? (
            <EmptyState icon={<BookCheck className="size-6" />} title="Aucune règle publiée">
              Une règle est obligatoire pour activer le programme.
            </EmptyState>
          ) : (
            <ol className="divide-y divide-line">
              {rules.map((r, i) => (
                <li key={r.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Version {r.version}</span>
                    {i === 0 && <Badge tone="success">En vigueur</Badge>}
                  </div>
                  <p className="text-xs text-muted">Depuis le {formatDate(r.effective_from)}</p>
                  <p className="mt-1">{r.description}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Modal
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title="Publier une nouvelle version de règle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRuleOpen(false)}>
              Annuler
            </Button>
            <Button variant="accent" disabled={ruleText.trim().length < 10} loading={busy === "rule"} onClick={addRule}>
              Publier
            </Button>
          </>
        }
      >
        <Alert tone="info">Une version publiée est immuable. Pour la modifier, vous publierez une nouvelle version.</Alert>
        <Field label="Critères d'éligibilité" required>
          <Textarea value={ruleText} onChange={(e) => setRuleText(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
