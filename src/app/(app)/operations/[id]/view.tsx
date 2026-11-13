"use client";

import { AlertTriangle, FileText, Home, Pencil, Search, UserPlus, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddAidButton, AidList, AidModal } from "@/components/aid";
import { OperationFormModal } from "@/components/operation-form";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  DefinitionList,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Stat,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { STATUS_TONE, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Assistance, Catalogs, Operation, OperationCase, OperationStats, Person } from "@/lib/types";

const OP_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  announced: [
    { to: "ongoing", label: "Démarrer" },
    { to: "closed", label: "Clôturer" },
  ],
  ongoing: [
    { to: "response", label: "Passer en accompagnement" },
    { to: "closed", label: "Clôturer" },
  ],
  response: [{ to: "closed", label: "Clôturer" }],
  closed: [{ to: "response", label: "Rouvrir" }],
};

export default function OperationDetailPage({ id }: { id: string }) {
  const { can } = useSession();
  const { data: op, mutate, error } = useApi<Operation>(`operations/${id}/`);
  const { data: stats, mutate: mutateStats } = useApi<OperationStats>(`operations/${id}/stats/`);
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ operation: id });
  if (status) params.set("status", status);
  if (q) params.set("search", q);
  const { data: cases, mutate: mutateCases } = useApi<Paginated<OperationCase>>(`operation-cases/?${params}`);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<OperationCase | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  if (error) return <Alert tone="danger">{error.status === 404 ? "Opération introuvable ou hors de votre périmètre." : error.message}</Alert>;
  if (!op) return <Spinner />;

  const refreshAll = () => Promise.all([mutate(), mutateStats(), mutateCases()]);

  async function transition(to: string) {
    setFeedback(null);
    try {
      await api(`operations/${id}/transition/`, { method: "POST", json: { to } });
      await refreshAll();
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Action impossible." });
    }
  }

  const needLabels = Object.fromEntries((catalogs?.case_needs ?? []).map((n) => [n.value, n.label]));
  const coverage = stats && stats.persons ? Math.round((stats.persons_helped / stats.persons) * 100) : 0;

  return (
    <>
      <PageHeader
        back={{ href: "/operations", label: "Opérations & sinistres" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {op.title} <Badge tone={STATUS_TONE[op.status]}>{op.status_label}</Badge>
          </span>
        }
        subtitle={`${op.kind_label} · ${op.code}${op.initiated_by_name ? ` · déclenchée par ${op.initiated_by_name}` : ""}`}
        actions={
          <>
            {can("operation.enroll") && op.status !== "closed" && (
              <>
                <Button variant="accent" icon={<UserPlus className="size-4" />} onClick={() => setEnrollOpen(true)}>
                  Ajouter des personnes
                </Button>
                <Link
                  href={`/beneficiaires/nouveau?operation=${op.id}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold hover:bg-navy-50"
                >
                  Recenser une personne
                </Link>
              </>
            )}
            {can("operation.manage") && (
              <>
                <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>
                  Modifier
                </Button>
                {OP_TRANSITIONS[op.status]?.map((t) => (
                  <Button key={t.to} variant="secondary" onClick={() => transition(t.to)}>
                    {t.label}
                  </Button>
                ))}
              </>
            )}
          </>
        }
      />
      {feedback && (
        <div className="mb-4">
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </div>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Personnes suivies"
            value={formatNumber(stats.persons)}
            hint={`${formatNumber(stats.households)} ménages${op.estimated_households ? ` · ${formatNumber(op.estimated_households)} estimés` : ""}`}
            icon={<Users className="size-5" />}
          />
          <Stat
            label="Ont perdu leur logement"
            value={formatNumber(stats.lost_housing)}
            hint={`${formatNumber(stats.lost_livelihood)} ont perdu leur activité · ${formatNumber(stats.lost_documents)} leurs papiers`}
            icon={<Home className="size-5" />}
            accent="danger"
          />
          <Stat
            label="Ont reçu au moins une aide"
            value={`${coverage} %`}
            hint={`${formatNumber(stats.persons_without_aid)} personne(s) encore sans aucune aide`}
            icon={<Wallet className="size-5" />}
            accent={coverage < 50 ? "danger" : "teal"}
          />
          <Stat
            label="Aides remises"
            value={formatMoney(stats.aid_delivered_amount)}
            hint={`${formatNumber(stats.persons_compensated)} indemnisée(s) / relogée(s) · ${formatMoney(stats.aid_planned_amount)} planifiés`}
            icon={<FileText className="size-5" />}
            accent="gold"
          />
        </div>
      )}
      {stats && stats.lost_contact > 0 && (
        <div className="mt-4">
          <Alert tone="warning" title={`${stats.lost_contact} personne(s) perdue(s) de vue`}>
            Planifiez une recherche active (contact de confiance, chef de quartier, site d&apos;accueil).
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personnes affectées" subtitle="Un dossier par personne, de l'identification à la clôture." />
          <div className="flex flex-wrap gap-3 border-b border-line p-4">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
              <Input placeholder="Nom, code, n° de dossier, lieu actuel" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-52" aria-label="Statut du dossier">
              <option value="">Tous les dossiers</option>
              {catalogs?.case_statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} {stats?.by_status[s.value] ? `(${stats.by_status[s.value]})` : ""}
                </option>
              ))}
            </Select>
          </div>
          {!cases ? (
            <Spinner />
          ) : !cases.results.length ? (
            <EmptyState icon={<Users className="size-6" />} title="Aucun dossier">
              Ajoutez des personnes déjà enregistrées ou recensez-les depuis l&apos;application Collecte en choisissant cette opération.
            </EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Personne</Th>
                  <Th>Pertes</Th>
                  <Th>Besoins</Th>
                  <Th>Aides</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {cases.results.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-navy-50/50" onClick={() => setSelected(c)}>
                    <Td>
                      <p className="font-semibold text-navy-900">{c.person_name}</p>
                      <p className="font-mono text-xs text-muted">
                        {c.case_number} · {c.person_code}
                      </p>
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {c.lost_housing && <Badge tone="danger">Logement</Badge>}
                        {c.lost_livelihood && <Badge tone="warning">Activité</Badge>}
                        {c.lost_documents && <Badge tone="warning">Papiers</Badge>}
                        {!c.lost_housing && !c.lost_livelihood && !c.lost_documents && <span className="text-xs text-soft">—</span>}
                      </span>
                    </Td>
                    <Td className="max-w-48 text-xs text-muted">{c.needs_labels.join(", ") || "—"}</Td>
                    <Td>
                      {c.aid_summary.delivered ? (
                        <span className="tabular text-xs font-semibold text-success">
                          {c.aid_summary.delivered} · {formatMoney(c.aid_summary.delivered_amount)}
                        </span>
                      ) : (
                        <Badge tone="danger">Aucune</Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[c.status]}>{c.status_label}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Fiche de l'opération" />
            <div className="space-y-4 p-5">
              <DefinitionList
                items={[
                  { label: "Territoire", value: op.territory_name },
                  { label: "Sites", value: op.sites },
                  { label: "Préavis", value: formatDate(op.notice_date) },
                  { label: "Début", value: formatDate(op.start_date) },
                  { label: "Référence officielle", value: op.legal_reference },
                  {
                    label: "Indemnité annoncée",
                    value: op.compensation_amount_per_household ? `${formatMoney(op.compensation_amount_per_household)} / ménage` : "—",
                  },
                ]}
              />
              {op.compensation_policy && <p className="rounded-lg bg-navy-50 p-3 text-sm">{op.compensation_policy}</p>}
              {op.partners_detail.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Intervenants</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {op.partners_detail.map((p) => (
                      <Badge key={p.id} tone="info">
                        {p.acronym || p.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
          {stats && Object.keys(stats.needs).length > 0 && (
            <Card>
              <CardHeader title="Besoins exprimés" />
              <ul className="space-y-2 p-5 text-sm">
                {Object.entries(stats.needs)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, n]) => (
                    <li key={k} className="flex justify-between">
                      <span>{needLabels[k] ?? k}</span>
                      <span className="tabular font-semibold">{n}</span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <EnrollModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        operation={op}
        onDone={(msg) => {
          setEnrollOpen(false);
          setFeedback({ tone: "success", text: msg });
          refreshAll();
        }}
      />
      {editOpen && (
        <OperationFormModal
          open
          initial={op}
          onClose={() => {
            setEditOpen(false);
            mutate();
          }}
        />
      )}
      <CaseModal
        kase={selected}
        catalogs={catalogs}
        onClose={() => setSelected(null)}
        onChanged={async (updated) => {
          await refreshAll();
          if (updated) setSelected(updated);
          else if (selected) setSelected(await api<OperationCase>(`operation-cases/${selected.id}/`));
        }}
      />
    </>
  );
}

function EnrollModal({
  open,
  onClose,
  operation,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  operation: Operation;
  onDone: (msg: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = useApi<Paginated<Person>>(open && q.length >= 2 ? `persons/?organization=${operation.organization}&q=${encodeURIComponent(q)}` : null);
  const [picked, setPicked] = useState<Person[]>([]);
  const [lostHousing, setLostHousing] = useState(operation.kind !== "mining_project");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ created: unknown[]; already_enrolled: string[] }>(`operations/${operation.id}/enroll/`, {
        method: "POST",
        json: { persons: picked.map((p) => p.id), lost_housing: lostHousing },
      });
      setPicked([]);
      setQ("");
      onDone(
        `${r.created.length} dossier(s) ouvert(s)${r.already_enrolled.length ? ` · déjà suivi(s) : ${r.already_enrolled.join(", ")}` : ""}.`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter des personnes affectées"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="accent" loading={busy} disabled={!picked.length} onClick={submit}>
            Ouvrir {picked.length || ""} dossier(s)
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Rechercher une personne enregistrée" hint="Nom, code dossier ou téléphone">
        <Input value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </Field>
      <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {(data?.results ?? []).map((p) => {
          const on = picked.some((x) => x.id === p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${on ? "bg-teal-50" : "hover:bg-navy-50"}`}
                onClick={() => setPicked(on ? picked.filter((x) => x.id !== p.id) : [...picked, p])}
              >
                <span>
                  <b>{p.display_name}</b> <span className="font-mono text-xs text-muted">{p.public_code}</span>
                  <span className="block text-xs text-muted">{p.territory_name ?? "—"}</span>
                </span>
                {on && <Badge tone="success">Sélectionnée</Badge>}
              </button>
            </li>
          );
        })}
        {q.length >= 2 && !data?.results.length && <li className="px-3 py-4 text-center text-sm text-muted">Aucun résultat. Recensez la personne d&apos;abord.</li>}
      </ul>
      {picked.length > 0 && <p className="text-sm">Sélection : {picked.map((p) => p.display_name).join(", ")}</p>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-teal-600" checked={lostHousing} onChange={(e) => setLostHousing(e.target.checked)} />
        Ces personnes ont perdu leur logement
      </label>
    </Modal>
  );
}

const CASE_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  identified: [
    { to: "assessed", label: "Besoins évalués" },
    { to: "supported", label: "En accompagnement" },
    { to: "lost_contact", label: "Perdue de vue" },
  ],
  assessed: [
    { to: "supported", label: "En accompagnement" },
    { to: "relocated", label: "Relogée / réinstallée" },
    { to: "lost_contact", label: "Perdue de vue" },
  ],
  supported: [
    { to: "relocated", label: "Relogée / réinstallée" },
    { to: "closed", label: "Clôturer" },
    { to: "lost_contact", label: "Perdue de vue" },
  ],
  relocated: [
    { to: "closed", label: "Clôturer" },
    { to: "supported", label: "Reprendre l'accompagnement" },
  ],
  lost_contact: [
    { to: "identified", label: "Personne retrouvée" },
    { to: "closed", label: "Clôturer" },
  ],
  closed: [{ to: "supported", label: "Rouvrir" }],
};

function CaseModal({
  kase,
  catalogs,
  onClose,
  onChanged,
}: {
  kase: OperationCase | null;
  catalogs?: Catalogs;
  onClose: () => void;
  onChanged: (updated?: OperationCase) => void;
}) {
  const { can } = useSession();
  const { data: aids, mutate: mutateAids } = useApi<Paginated<Assistance>>(kase ? `assistances/?operation_case=${kase.id}` : null);
  const [draft, setDraft] = useState<Partial<OperationCase> | null>(null);
  const [prev, setPrev] = useState(kase);
  if (kase !== prev) {
    setPrev(kase);
    setDraft(null);
  }
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aidOpen, setAidOpen] = useState(false);
  if (!kase) return null;
  const v = { ...kase, ...draft };
  const editable = can("operation.enroll");

  async function save() {
    if (!kase || !draft) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api<OperationCase>(`operation-cases/${kase.id}/`, { method: "PATCH", json: draft });
      setDraft(null);
      onChanged(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function transition(to: string) {
    if (!kase) return;
    setError(null);
    try {
      const updated = await api<OperationCase>(`operation-cases/${kase.id}/transition/`, { method: "POST", json: { to, reason } });
      setReason("");
      onChanged(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Action impossible.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-950/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-2xl overflow-y-auto bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Dossier ${kase.case_number}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-6 py-4">
          <div>
            <p className="font-mono text-xs text-muted">{kase.case_number}</p>
            <h2 className="text-lg font-bold text-navy-900">{kase.person_name}</h2>
            <p className="text-sm text-muted">
              <Link href={`/beneficiaires/${kase.person}`} className="text-teal-700 hover:underline">
                Ouvrir le dossier complet ({kase.person_code})
              </Link>
              {kase.person_phone && ` · ${kase.person_phone}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[kase.status]}>{kase.status_label}</Badge>
            <Button variant="ghost" className="h-8 px-2" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
        <div className="space-y-5 p-6">
          {error && <Alert tone="danger">{error}</Alert>}
          {kase.status === "lost_contact" && (
            <Alert tone="warning" title="Perdue de vue">
              Dernier contact : {formatDate(kase.last_contact_at, true)}
            </Alert>
          )}
          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold">Situation et pertes</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["lost_housing", "A perdu son logement"],
                  ["lost_livelihood", "A perdu son activité"],
                  ["lost_documents", "A perdu ses papiers"],
                  ["children_schooling_disrupted", "Scolarité des enfants interrompue"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-teal-600"
                    disabled={!editable}
                    checked={!!v[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
              <Field label="Statut d'occupation">
                <Select disabled={!editable} value={v.occupancy} onChange={(e) => setDraft({ ...draft, occupancy: e.target.value })}>
                  {catalogs?.occupancy.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Indemnisation due (FCFA)">
                <Input
                  type="number"
                  min={0}
                  disabled={!editable}
                  value={v.compensation_due ?? ""}
                  onChange={(e) => setDraft({ ...draft, compensation_due: e.target.value || null })}
                />
              </Field>
              <Field label="Où vit la personne aujourd'hui">
                <Input disabled={!editable} value={v.current_location} onChange={(e) => setDraft({ ...draft, current_location: e.target.value })} />
              </Field>
              <Field label="Site de relogement / réinstallation">
                <Input disabled={!editable} value={v.relocation_site} onChange={(e) => setDraft({ ...draft, relocation_site: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Biens perdus">
                  <Textarea
                    disabled={!editable}
                    value={v.lost_assets}
                    onChange={(e) => setDraft({ ...draft, lost_assets: e.target.value })}
                    className="min-h-14"
                  />
                </Field>
              </div>
            </div>
            <p className="mb-2 mt-4 text-sm font-semibold">Besoins</p>
            <div className="flex flex-wrap gap-2">
              {catalogs?.case_needs.map((n) => {
                const on = (v.needs ?? []).includes(n.value);
                return (
                  <button
                    type="button"
                    key={n.value}
                    disabled={!editable}
                    onClick={() => setDraft({ ...draft, needs: on ? v.needs!.filter((x) => x !== n.value) : [...(v.needs ?? []), n.value] })}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white hover:bg-navy-50"}`}
                    aria-pressed={on}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <Field label="Notes de suivi">
                <Textarea disabled={!editable} value={v.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="min-h-16" />
              </Field>
            </div>
            {editable && draft && (
              <div className="mt-3 flex justify-end">
                <Button loading={busy} onClick={save}>
                  Enregistrer le dossier
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Aides reçues pour ce dossier" action={<AddAidButton onClick={() => setAidOpen(true)} />} />
            <AidList
              aids={aids?.results}
              onChanged={() => {
                mutateAids();
                onChanged();
              }}
              emptyText="Aucune aide pour l'instant."
            />
          </Card>

          {editable && (
            <Card className="p-5">
              <p className="mb-2 text-sm font-semibold">Faire avancer le dossier</p>
              <Field label="Motif / observation" hint="Obligatoire pour clôturer ou déclarer « perdue de vue ».">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                {CASE_TRANSITIONS[kase.status]?.map((t) => (
                  <Button key={t.to} variant={t.to === "lost_contact" || t.to === "closed" ? "secondary" : "primary"} onClick={() => transition(t.to)}>
                    {t.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}
          {kase.status === "closed" && <p className="flex items-center gap-2 text-xs text-muted"><AlertTriangle className="size-3.5" /> Dossier clôturé : il peut être rouvert.</p>}
        </div>
      </aside>
      <AidModal
        open={aidOpen}
        onClose={() => setAidOpen(false)}
        personId={kase.person}
        personName={kase.person_name}
        operationCaseId={kase.id}
        onSaved={() => {
          setAidOpen(false);
          mutateAids();
          onChanged();
        }}
      />
    </div>
  );
}
