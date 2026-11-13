"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, type ComponentProps, type ReactNode } from "react";
import type { Tone } from "@/lib/format";

// ---------------------------------------------------------------- Boutons

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 h-10 px-4 whitespace-nowrap";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800",
  accent: "bg-teal-600 text-white hover:bg-teal-700",
  secondary: "bg-white text-ink border border-line hover:bg-navy-50",
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

// ---------------------------------------------------------------- Structure

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={clsx("rounded-card border border-line bg-white", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-block text-sm font-medium text-teal-700 hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-navy-50 text-muted ring-line",
  info: "bg-navy-100 text-navy-800 ring-navy-100",
  success: "bg-success-50 text-success ring-success-50",
  warning: "bg-warning-50 text-warning ring-warning-50",
  danger: "bg-danger-50 text-danger ring-danger-50",
  gold: "bg-gold-100 text-gold-600 ring-gold-100",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
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
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "navy" | "teal" | "gold" | "danger";
}) {
  const accents = {
    navy: "bg-navy-100 text-navy-800",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-gold-100 text-gold-600",
    danger: "bg-danger-50 text-danger",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && <span className={clsx("grid size-9 place-items-center rounded-lg", accents[accent])}>{icon}</span>}
      </div>
      <p className="tabular mt-3 text-3xl font-bold text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-navy-50 text-navy-700">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
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
    <div className={clsx("flex gap-3 rounded-lg border px-4 py-3 text-sm", map.cls)} role={tone === "danger" ? "alert" : "status"}>
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
    <th className={clsx("border-b border-line bg-navy-50/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx("border-b border-line/70 px-4 py-3 align-middle", className)}>{children}</td>;
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
        className="w-full max-w-lg rounded-card bg-white shadow-2xl"
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
