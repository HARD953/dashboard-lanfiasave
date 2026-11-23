/* eslint-disable @next/next/no-img-element -- photos servies par Wikimedia Commons, chargées par le navigateur */
import clsx from "clsx";
import type { ReactNode } from "react";
import { PHOTOS, type PhotoKey } from "@/lib/photos";

export function PhotoCredit({ id, className }: { id: PhotoKey; className?: string }) {
  const p = PHOTOS[id];
  return (
    <a
      href={p.source}
      target="_blank"
      rel="noreferrer"
      className={clsx("rounded bg-black/45 px-1.5 py-0.5 text-[10px] leading-tight text-white/85 hover:text-white", className)}
    >
      Photo : {p.author} · {p.license}
    </a>
  );
}

/** Photo réelle avec son crédit (auteur, licence, lien vers la source). */
export function Photo({ id, className, priority }: { id: PhotoKey; className?: string; priority?: boolean }) {
  const p = PHOTOS[id];
  return (
    <figure className={clsx("relative overflow-hidden bg-navy-100", className)}>
      <img
        src={p.src}
        alt={p.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: "position" in p ? p.position : "center" }}
      />
      <PhotoCredit id={id} className="absolute bottom-2 right-2" />
    </figure>
  );
}

/** Bandeau photo avec voile sombre et texte, pour l'en-tête des pages de pilotage. */
export function PhotoBanner({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: PhotoKey;
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const p = PHOTOS[id];
  return (
    <section className={clsx("rise-in relative mb-5 min-h-40 overflow-hidden rounded-2xl bg-navy-900", className)}>
      <img
        src={p.src}
        alt={p.alt}
        decoding="async"
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: "position" in p ? p.position : "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/75 to-navy-900/0" aria-hidden />
      <div className="stripe absolute inset-x-0 top-0 h-[3px]" aria-hidden />
      <div className="relative px-6 py-7 sm:px-7">
        {eyebrow && <p className="text-xs font-semibold text-[#c8e6f8]/90">{eyebrow}</p>}
        <h1 className="mt-1 max-w-2xl text-[22px] font-bold tracking-tight text-white">{title}</h1>
        {children && <div className="mt-1.5 max-w-xl text-[13px] text-[#c8e6f8]/85">{children}</div>}
      </div>
      <PhotoCredit id={id} className="absolute bottom-2 right-2" />
    </section>
  );
}
