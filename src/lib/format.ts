export const BANDS: Record<string, { label: string; tone: Tone }> = {
  low: { label: "Faible", tone: "neutral" },
  medium: { label: "Moyenne", tone: "info" },
  high: { label: "Élevée", tone: "warning" },
  very_high: { label: "Très élevée", tone: "danger" },
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "gold";

export const STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  submitted: "info",
  quality_check: "info",
  to_correct: "warning",
  verified: "success",
  active: "success",
  archived: "neutral",
  admissible: "info",
  inadmissible: "danger",
  on_hold: "warning",
  under_review: "info",
  committee: "gold",
  decided: "success",
  withdrawn: "neutral",
  approved: "success",
  rejected: "danger",
  deferred: "warning",
  suspended: "warning",
  closed: "neutral",
  open: "warning",
  upheld: "success",
  dismissed: "neutral",
  // opérations et dossiers
  announced: "gold",
  ongoing: "danger",
  response: "info",
  identified: "warning",
  assessed: "info",
  supported: "success",
  relocated: "success",
  lost_contact: "danger",
  // aides et vulnérabilités
  planned: "warning",
  delivered: "success",
  cancelled: "neutral",
  suspected: "warning",
  confirmed: "danger",
  resolved: "neutral",
};

export function labelOf(options: { value: string; label: string }[] | undefined, value?: string | null) {
  return options?.find((o) => o.value === value)?.label ?? value ?? "—";
}

export const APPLICATION_STATUS: Record<string, string> = {
  submitted: "Déposée",
  admissible: "Recevable",
  inadmissible: "Non recevable",
  on_hold: "En attente de pièces",
  under_review: "Avis social en cours",
  committee: "Au comité",
  decided: "Décidée",
  withdrawn: "Retirée",
};

export const APPLICATION_TRANSITIONS: Record<string, string[]> = {
  submitted: ["admissible", "inadmissible", "on_hold", "withdrawn"],
  on_hold: ["admissible", "inadmissible", "withdrawn"],
  admissible: ["under_review", "withdrawn"],
  inadmissible: ["submitted"],
  under_review: ["committee", "on_hold", "withdrawn"],
  committee: ["under_review"],
  decided: [],
  withdrawn: [],
};

export const PROGRAM_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  draft: [{ to: "submitted", label: "Soumettre pour approbation" }],
  submitted: [
    { to: "approved", label: "Approuver" },
    { to: "draft", label: "Renvoyer en brouillon" },
  ],
  approved: [{ to: "active", label: "Activer" }],
  active: [
    { to: "suspended", label: "Suspendre" },
    { to: "closed", label: "Clôturer" },
  ],
  suspended: [
    { to: "active", label: "Réactiver" },
    { to: "closed", label: "Clôturer" },
  ],
  closed: [{ to: "archived", label: "Archiver" }],
  archived: [],
};

export const SEX: Record<string, string> = { F: "Femme", M: "Homme", U: "Non déclaré" };

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function formatMoney(value?: string | number | null, currency = "XOF") {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString("fr-FR")} ${currency === "XOF" ? "FCFA" : currency}`;
}

export function formatNumber(n?: number | null) {
  return n === null || n === undefined ? "—" : n.toLocaleString("fr-FR");
}
