"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, Loader2, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type { Tone } from "@/lib/format";

// ---------------------------------------------------------------- Boutons

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 h-9 px-3.5 whitespace-nowrap";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-navy-700 text-white hover:bg-navy-800 shadow-sm",
  accent: "bg-navy-900 text-white hover:bg-navy-950",
  secondary: "bg-white text-[#2a4a62] border border-[#c0d4e6] hover:bg-navy-50",
  ghost: "text-navy-800 hover:bg-navy-50",
  danger: "bg-danger text-white hover:opacity-90",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & { variant?: ButtonVariant; loading?: boolean; icon?: ReactNode }
>(function Button({ variant = "primary", loading, icon, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(buttonBase, buttonVariants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  icon,
  children,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={clsx(buttonBase, buttonVariants[variant], className)}>
      {icon}
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------- Aide contextuelle

/** Une explication longue ne s'affiche pas en permanence : une icône ⓘ la montre au survol ou au clic. */
export function InfoTip({ children, light = false, label = "En savoir plus" }: { children: ReactNode; light?: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={clsx(
          "grid size-5 place-items-center rounded-full transition",
          light ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-soft hover:bg-navy-50 hover:text-navy-700",
        )}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-40 mt-1.5 w-72 -translate-x-1/2 rounded-xl border border-line bg-white p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-[#2a4a62] shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}

/** Texte court affiché tel quel ; texte long rangé derrière ⓘ. */
function Hint({ text, light, max = 90 }: { text: ReactNode; light?: boolean; max?: number }) {
  if (typeof text === "string" && text.length > max) return <InfoTip light={light}>{text}</InfoTip>;
  return <span className={clsx("text-xs", light ? "text-[#c8e6f8]/85" : "text-muted")}>{text}</span>;
}

// ---------------------------------------------------------------- Structure

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={clsx("rounded-card border border-line bg-white shadow-[var(--shadow-card)]", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-4 shrink-0 text-navy-700" />}
        <h2 className="text-[13.5px] font-bold text-ink">{title}</h2>
        {subtitle && <Hint text={subtitle} max={60} />}
      </div>
      {action}
    </div>
  );
}

/**
 * En-tête de chaque écran, comme les bandeaux LanfiaLink : fond bleu profond, filet dégradé, titre et actions.
 * Le sous-titre s'affiche s'il est court ; sinon il passe derrière ⓘ.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  kicker,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  kicker?: ReactNode;
}) {
  return (
    <div className="rise-in relative mb-5 overflow-hidden rounded-2xl bg-navy-900 px-5 pb-5 pt-6">
      <div className="stripe absolute inset-x-0 top-0 h-[3px]" />
      <svg aria-hidden className="pointer-events-none absolute right-0 top-0 size-40 opacity-[0.13]" viewBox="0 0 144 144">
        <circle cx="144" cy="0" r="100" fill="none" stroke="#4FB3E8" strokeWidth="1.5" />
        <circle cx="144" cy="0" r="65" fill="none" stroke="#4FB3E8" strokeWidth="1" />
        <circle cx="144" cy="0" r="32" fill="none" stroke="#4FB3E8" strokeWidth="0.8" />
        <line x1="144" y1="0" x2="0" y2="144" stroke="#4FB3E8" strokeWidth="0.7" />
        <line x1="144" y1="0" x2="40" y2="144" stroke="#4FB3E8" strokeWidth="0.5" />
      </svg>
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {back ? (
            <Link href={back.href} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-[#c8e6f8]/90 hover:text-white">
              <ArrowLeft className="size-3.5" /> {back.label}
            </Link>
          ) : (
            kicker && <p className="mb-1 text-xs font-semibold text-[#c8e6f8]/90">{kicker}</p>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && typeof subtitle === "string" && subtitle.length > 90 && <Hint text={subtitle} light />}
          </div>
          {subtitle && !(typeof subtitle === "string" && subtitle.length > 90) && (
            <p className="mt-1 max-w-3xl text-[13px] text-[#c8e6f8]/85">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[#eaf0f5] text-[#3a5a72]",
  info: "bg-navy-100 text-[#083f6a]",
  success: "bg-success-50 text-[#044d38]",
  warning: "bg-warning-50 text-gold-600",
  danger: "bg-danger-50 text-[#7a2410]",
  gold: "bg-gold-100 text-gold-600",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent = "navy",
  growth,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "navy" | "teal" | "gold" | "danger" | "success";
  /** Évolution en % par rapport à la période précédente. */
  growth?: number | null;
}) {
  const accents = {
    navy: "bg-navy-700/10 text-navy-700",
    teal: "bg-navy-950/10 text-navy-900",
    gold: "bg-gold-500/10 text-gold-500",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
  };
  return (
    <Card className="rise-in flex min-w-0 justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-[11.5px] font-bold text-muted">{label}</p>
        <p className="tabular mt-1.5 text-[22px] font-extrabold leading-tight text-ink">{value}</p>
        {growth !== undefined && growth !== null && Number.isFinite(growth) ? (
          <p className={clsx("mt-1 text-[11px] font-bold", growth >= 0 ? "text-success" : "text-danger")}>
            {growth >= 0 ? "▲" : "▼"} {Math.abs(growth).toFixed(1).replace(".", ",")} % vs période précédente
          </p>
        ) : (
          hint && (
            <p className="mt-1 truncate text-[11px] text-muted" title={typeof hint === "string" ? hint : undefined}>
              {hint}
            </p>
          )
        )}
      </div>
      {icon && (
        <span className={clsx("grid size-10 shrink-0 place-items-center rounded-[11px] [&_svg]:size-[18px]", accents[accent])}>{icon}</span>
      )}
    </Card>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {icon && <div className="mb-2 grid size-10 place-items-center rounded-full bg-navy-50 text-navy-700 [&_svg]:size-5">{icon}</div>}
      <p className="text-[13px] font-bold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-md text-xs text-muted">{children}</div>}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
      <Loader2 className="size-5 animate-spin text-teal-600" />
      {label}
    </div>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "warning" | "danger" | "success"; title?: string; children: ReactNode }) {
  const map = {
    info: { cls: "border-navy-100 bg-navy-50 text-navy-800", Icon: Info },
    warning: { cls: "border-warning-50 bg-warning-50 text-warning", Icon: AlertTriangle },
    danger: { cls: "border-danger-50 bg-danger-50 text-danger", Icon: AlertTriangle },
    success: { cls: "border-success-50 bg-success-50 text-success", Icon: CheckCircle2 },
  }[tone];
  return (
    <div className={clsx("flex gap-3 rounded-xl border px-4 py-2.5 text-[13px]", map.cls)} role={tone === "danger" ? "alert" : "status"}>
      <map.Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={clsx(title && "mt-0.5", "text-ink/80")}>{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Formulaires

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

const inputCls =
  "block w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-soft focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:bg-navy-50";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={clsx(inputCls, "h-10", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={clsx(inputCls, "h-10 pr-8", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea(
  { className, ...p },
  ref,
) {
  return <textarea ref={ref} className={clsx(inputCls, "min-h-24 py-2", className)} {...p} />;
});

// ---------------------------------------------------------------- Tableaux

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={clsx("whitespace-nowrap border-b border-line px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx("border-b border-[#f0f5f9] px-4 py-2.5 align-middle text-[13px]", className)}>{children}</td>;
}

// ---------------------------------------------------------------- Fenêtre modale

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-navy-50" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{i.label}</dt>
          <dd className="mt-1 text-sm text-ink">{i.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
