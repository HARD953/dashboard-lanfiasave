"use client";

import { Building2, KeyRound, Landmark, Plus, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { ApiError, api, useApi, type Paginated } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { AdminOrganization, AdminUser, Catalogs, Partner, RoleInfo } from "@/lib/types";

type Tab = "users" | "partners" | "organizations";

export default function AdministrationPage() {
  const { isPlatformAdmin, can } = useSession();
  const tabs: { key: Tab; label: string; icon: typeof Users; show: boolean }[] = [
    { key: "users", label: "Comptes utilisateurs", icon: Users, show: isPlatformAdmin || can("user.manage") },
    { key: "partners", label: "Structures partenaires", icon: Landmark, show: can("partner.view") },
    { key: "organizations", label: "Organisations", icon: Building2, show: isPlatformAdmin },
  ];
  const visible = tabs.filter((t) => t.show);
  const [tab, setTab] = useState<Tab>(visible[0]?.key ?? "users");

  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Comptes, rôles et structures. Chaque action est enregistrée dans le journal d'audit."
      />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1" role="tablist">
        {visible.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-navy-900 text-white" : "text-muted hover:bg-navy-50"
            }`}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "users" && <UsersTab />}
      {tab === "partners" && <PartnersTab />}
      {tab === "organizations" && <OrganizationsTab />}
    </>
  );
}

// ------------------------------------------------------------------ Comptes

function UsersTab() {
  const { organizationId, isPlatformAdmin, organizations } = useSession();
  const { data: orgs } = useApi<AdminOrganization[] | Paginated<AdminOrganization>>(
    isPlatformAdmin ? "admin/organizations/" : null,
  );
  const orgList: { id: string; name: string }[] = isPlatformAdmin
    ? (Array.isArray(orgs) ? orgs : orgs?.results ?? []).map((o) => ({ id: o.id, name: o.name }))
    : organizations;
  const [orgFilter, setOrgFilter] = useState<string>("");
  const currentOrg = orgFilter || organizationId || orgList[0]?.id || "";
  const [q, setQ] = useState("");
  const params = new URLSearchParams();
  if (currentOrg) params.set("organization", currentOrg);
  if (q) params.set("search", q);
  const { data, isLoading, mutate } = useApi<Paginated<AdminUser>>(currentOrg ? `admin/users/?${params}` : null);
  const { data: roles } = useApi<RoleInfo[]>("admin/roles/");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoles, setEditRoles] = useState<AdminUser | null>(null);
  const [secret, setSecret] = useState<{ username: string; password: string } | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setFeedback(null);
    try {
      await fn();
      await mutate();
      setFeedback({ tone: "success", text: ok });
    } catch (e) {
      setFeedback({ tone: "danger", text: e instanceof ApiError ? e.readable : "Action impossible." });
    }
  }

  return (
    <div className="space-y-4">
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
      {secret && (
        <Alert tone="success" title={`Mot de passe provisoire de « ${secret.username} »`}>
          <span className="font-mono text-lg tracking-wide">{secret.password}</span>
          <br />
          Transmettez-le de façon sécurisée. Il ne sera plus affiché ; la personne devra le changer à la première connexion.
        </Alert>
      )}
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          {orgList.length > 1 && (
            <Select value={currentOrg} onChange={(e) => setOrgFilter(e.target.value)} className="w-64" aria-label="Organisation">
              {orgList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          )}
          <Input placeholder="Rechercher un nom, un identifiant…" className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button className="ml-auto" variant="accent" icon={<UserPlus className="size-4" />} onClick={() => setCreateOpen(true)} disabled={!currentOrg}>
            Nouveau compte
          </Button>
        </div>
        {!currentOrg ? (
          <EmptyState icon={<Building2 className="size-6" />} title="Aucune organisation">
            Créez d&apos;abord une organisation dans l&apos;onglet « Organisations ».
          </EmptyState>
        ) : isLoading ? (
          <Spinner />
        ) : !data?.results.length ? (
          <EmptyState icon={<Users className="size-6" />} title="Aucun compte">
            Créez les comptes des agents, travailleurs sociaux, membres du comité…
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Personne</Th>
                <Th>Rôles</Th>
                <Th>État</Th>
                <Th>Dernière connexion</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((u) => (
                <tr key={u.id} className={u.is_active ? "" : "opacity-60"}>
                  <Td>
                    <p className="font-semibold text-navy-900">{u.full_name}</p>
                    <p className="font-mono text-xs text-muted">{u.username}</p>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {u.is_superuser && <Badge tone="gold">Plateforme</Badge>}
                      {u.memberships.map((m) => (
                        <Badge key={m.id} tone="info">
                          {m.role_label}
                        </Badge>
                      ))}
                    </span>
                  </Td>
                  <Td>
                    {!u.is_active ? (
                      <Badge tone="neutral">Désactivé</Badge>
                    ) : u.must_change_password ? (
                      <Badge tone="warning">Mot de passe provisoire</Badge>
                    ) : (
                      <Badge tone="success">Actif</Badge>
                    )}
                  </Td>
                  <Td className="text-muted">{u.last_login ? formatDate(u.last_login, true) : "Jamais"}</Td>
                  <Td className="text-right">
                    <span className="inline-flex flex-wrap justify-end gap-1">
                      <Button variant="ghost" className="h-8 px-2" icon={<ShieldCheck className="size-4" />} onClick={() => setEditRoles(u)}>
                        Rôles
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2"
                        icon={<KeyRound className="size-4" />}
                        onClick={() =>
                          run(async () => {
                            const r = await api<{ username: string; temporary_password: string }>(`admin/users/${u.id}/reset-password/`, { method: "POST" });
                            setSecret({ username: r.username, password: r.temporary_password });
                          }, "Mot de passe réinitialisé.")
                        }
                      >
                        Réinitialiser
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() =>
                          run(
                            () => api(`admin/users/${u.id}/`, { method: "PATCH", json: { is_active: !u.is_active } }),
                            u.is_active ? "Compte désactivé." : "Compte réactivé.",
                          )
                        }
                      >
                        {u.is_active ? "Désactiver" : "Réactiver"}
                      </Button>
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organization={currentOrg}
        roles={roles ?? []}
        onCreated={(u) => {
          setCreateOpen(false);
          if (u.temporary_password) setSecret({ username: u.username, password: u.temporary_password });
          setFeedback({ tone: "success", text: `Compte « ${u.username} » créé.` });
          mutate();
        }}
      />
      <RolesModal
        user={editRoles}
        organization={currentOrg}
        roles={roles ?? []}
        onClose={() => setEditRoles(null)}
        onSaved={() => {
          setEditRoles(null);
          setFeedback({ tone: "success", text: "Rôles mis à jour." });
          mutate();
        }}
      />
    </div>
  );
}

function RolePicker({ roles, value, onChange }: { roles: RoleInfo[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
      {roles.map((r) => {
        const on = value.includes(r.value);
        return (
          <label
            key={r.value}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${on ? "border-teal-500 bg-teal-50" : "border-line hover:bg-navy-50"}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-teal-600"
              checked={on}
              onChange={() => onChange(on ? value.filter((x) => x !== r.value) : [...value, r.value])}
            />
            <span>
              <span className="font-semibold text-ink">{r.label}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {r.permissions.slice(0, 4).map((p) => p.label).join(" · ")}
                {r.permissions.length > 4 && ` · +${r.permissions.length - 4}`}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  organization,
  roles,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  organization: string;
  roles: RoleInfo[];
  onCreated: (u: AdminUser) => void;
}) {
  const empty = { username: "", first_name: "", last_name: "", email: "", phone: "" };
  const [f, setF] = useState(empty);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const u = await api<AdminUser>("admin/users/", { method: "POST", json: { ...f, organization, roles: selected } });
      setF(empty);
      setSelected([]);
      onCreated(u);
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau compte"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="accent" loading={busy} disabled={!f.username || !f.first_name || !selected.length} onClick={submit}>
            Créer le compte
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Prénom(s)" required>
          <Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} />
        </Field>
        <Field label="Nom">
          <Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} />
        </Field>
        <Field label="Identifiant de connexion" hint="Ex. a.kone" required>
          <Input value={f.username} autoCapitalize="none" onChange={(e) => setF({ ...f, username: e.target.value.trim() })} />
        </Field>
        <Field label="Téléphone">
          <Input value={f.phone} inputMode="tel" onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="E-mail">
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Rôles</p>
        <RolePicker roles={roles} value={selected} onChange={setSelected} />
      </div>
      <p className="text-xs text-muted">Un mot de passe provisoire sera généré et affiché une seule fois.</p>
    </Modal>
  );
}

function RolesModal({
  user,
  organization,
  roles,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  organization: string;
  roles: RoleInfo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = user?.memberships.filter((m) => m.organization === organization).map((m) => m.role) ?? [];
  const [selected, setSelected] = useState<string[] | null>(null);
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setSelected(null);
  }
  const value = selected ?? initial;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await api(`admin/users/${user.id}/roles/`, { method: "POST", json: { organization, roles: value } });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Rôles de ${user?.full_name ?? ""}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={busy} onClick={save}>
            Enregistrer
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <RolePicker roles={roles} value={value} onChange={setSelected} />
      <p className="text-xs text-muted">Sans aucun rôle, la personne ne voit plus aucune donnée de l&apos;organisation.</p>
    </Modal>
  );
}

// ------------------------------------------------------------------ Structures partenaires

function PartnersTab() {
  const { organizationId, can } = useSession();
  const { data, isLoading, mutate } = useApi<Partner[]>(organizationId ? `partners/?organization=${organizationId}` : null);
  const { data: catalogs } = useApi<Catalogs>("catalogs/");
  const [edit, setEdit] = useState<Partial<Partner> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!edit) return;
    setBusy(true);
    setError(null);
    try {
      if (edit.id) await api(`partners/${edit.id}/`, { method: "PATCH", json: edit });
      else await api("partners/", { method: "POST", json: { ...edit, organization: organizationId } });
      setEdit(null);
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-line p-4">
        <p className="text-sm text-muted">
          Gouvernement, ministères, mairies, entreprises minières, ONG, agences des Nations unies… qui déclenchent des
          opérations ou apportent des aides.
        </p>
        {can("partner.manage") && (
          <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setEdit({ kind: "government", is_active: true })}>
            Ajouter
          </Button>
        )}
      </div>
      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState icon={<Landmark className="size-6" />} title="Aucune structure enregistrée" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Structure</Th>
              <Th>Type</Th>
              <Th>Contact</Th>
              <Th>État</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <Td>
                  <p className="font-semibold text-navy-900">{p.name}</p>
                  {p.acronym && <p className="text-xs text-muted">{p.acronym}</p>}
                </Td>
                <Td>{p.kind_label}</Td>
                <Td className="text-muted">{[p.contact_name, p.phone, p.email].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>{p.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</Td>
                <Td className="text-right">
                  {can("partner.manage") && (
                    <Button variant="ghost" className="h-8 px-2" onClick={() => setEdit(p)}>
                      Modifier
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? "Modifier la structure" : "Nouvelle structure"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Annuler
            </Button>
            <Button variant="accent" loading={busy} disabled={!edit?.name} onClick={save}>
              Enregistrer
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger">{error}</Alert>}
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nom" required>
                <Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </Field>
            </div>
            <Field label="Sigle">
              <Input value={edit.acronym ?? ""} onChange={(e) => setEdit({ ...edit, acronym: e.target.value })} />
            </Field>
            <Field label="Type" required>
              <Select value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>
                {catalogs?.partner_kinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Personne de contact">
              <Input value={edit.contact_name ?? ""} onChange={(e) => setEdit({ ...edit, contact_name: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="E-mail">
                <Input type="email" value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className="min-h-16" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-teal-600" checked={!!edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />
              Structure active
            </label>
          </div>
        )}
      </Modal>
    </Card>
  );
}

// ------------------------------------------------------------------ Organisations (plateforme)

const ORG_KINDS = [
  ["ngo", "ONG"],
  ["foundation", "Fondation"],
  ["local_authority", "Collectivité"],
  ["public_institution", "Institution publique"],
  ["csr", "Programme RSE"],
  ["operator", "Opérateur de la plateforme"],
];

function OrganizationsTab() {
  const { data, isLoading, mutate } = useApi<AdminOrganization[] | Paginated<AdminOrganization>>("admin/organizations/");
  const list = Array.isArray(data) ? data : data?.results ?? [];
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", code: "", kind: "ngo" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await api("admin/organizations/", { method: "POST", json: f });
      setOpen(false);
      setF({ name: "", code: "", kind: "ngo" });
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.readable : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-line p-4">
        <p className="text-sm text-muted">Chaque organisation est un espace isolé : ses données ne sont jamais visibles des autres.</p>
        <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
          Nouvelle organisation
        </Button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Organisation</Th>
              <Th>Type</Th>
              <Th>Membres</Th>
              <Th>Créée le</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <Td>
                  <p className="font-semibold text-navy-900">{o.name}</p>
                  <p className="font-mono text-xs text-muted">{o.code}</p>
                </Td>
                <Td>{ORG_KINDS.find(([v]) => v === o.kind)?.[1] ?? o.kind}</Td>
                <Td className="tabular">{o.members_count}</Td>
                <Td className="text-muted">{formatDate(o.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle organisation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="accent" loading={busy} disabled={!f.name || !f.code} onClick={create}>
              Créer
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Nom" required>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Code court" hint="Lettres minuscules, chiffres et tirets" required>
          <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
        </Field>
        <Field label="Type">
          <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            {ORG_KINDS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-xs text-muted">Créez ensuite son premier administrateur dans l&apos;onglet « Comptes utilisateurs ».</p>
      </Modal>
    </Card>
  );
}
