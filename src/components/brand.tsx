import clsx from "clsx";

/** Logo LanfiaSave : un bouclier stylisé (protection) traversé d'une pousse (autonomie). */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
        <path d="M20 3 6 8.5v10.2C6 27.4 12 34.6 20 37c8-2.4 14-9.6 14-18.3V8.5L20 3Z" fill="#1A8FD1" />
        <path d="M20 3v34c8-2.4 14-9.6 14-18.3V8.5L20 3Z" fill="#0D4E7A" opacity=".45" />
        <path d="M20 29V17m0 0c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5Zm0 3c0-3.2-2.4-5.2-5.6-5.2 0 3.2 2.4 5.2 5.6 5.2Z" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="30.5" r="1.6" fill="#D08A00" />
      </svg>
      <span className="leading-tight">
        <span className={clsx("block text-[17px] font-bold tracking-tight", light ? "text-white" : "text-navy-900")}>
          Lanfia<span className={light ? "text-teal-500" : "text-navy-700"}>Save</span>
        </span>
        <span className={clsx("block text-[10.5px] font-medium uppercase tracking-[0.14em]", light ? "text-white/60" : "text-muted")}>
          par LanfiaTech
        </span>
      </span>
    </span>
  );
}
