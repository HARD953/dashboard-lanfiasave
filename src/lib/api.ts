"use client";

import useSWR, { type SWRConfiguration } from "swr";

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Premier message lisible, y compris pour les erreurs de validation champ par champ. */
  get readable(): string {
    const d = this.details as Record<string, unknown> | null;
    if (d && typeof d === "object") {
      const first = Object.entries(d)[0];
      if (first) {
        const [field, val] = first;
        const msg = Array.isArray(val) ? val[0] : typeof val === "string" ? val : null;
        if (msg) return field === "non_field_errors" ? String(msg) : `${String(msg)}`;
      }
    }
    return this.message;
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers || {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    // Session expirée : rechargement complet vers la connexion.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/connexion?suite=${encodeURIComponent(window.location.pathname)}`;
    throw new ApiError(401, "unauthenticated", "Session expirée.");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? "error", err.message ?? "Une erreur est survenue.", err.details);
  }
  return data as T;
}

export function useApi<T>(path: string | null, config?: SWRConfiguration) {
  return useSWR<T, ApiError>(path, (p: string) => api<T>(p), { revalidateOnFocus: false, ...config });
}

export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
