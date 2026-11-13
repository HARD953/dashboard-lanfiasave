"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useApi } from "./api";
import type { Me, Membership } from "./types";

type Session = {
  me: Me | undefined;
  loading: boolean;
  organizationId: string | null;
  setOrganizationId: (id: string) => void;
  organizations: { id: string; name: string }[];
  membershipsInOrg: Membership[];
  can: (perm: string) => boolean;
  /** Super-administrateur de la plateforme (gère toutes les organisations, sans accès implicite aux données). */
  isPlatformAdmin: boolean;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);
const ORG_KEY = "lfs.organization";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, mutate } = useApi<Me>("auth/me/");
  const [chosen, setChosen] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(ORG_KEY);
    } catch {
      return null;
    }
  });

  const organizations = useMemo(() => {
    const seen = new Map<string, string>();
    me?.memberships.forEach((m) => seen.set(m.organization, m.organization_name));
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [me]);

  const organizationId = organizations.find((o) => o.id === chosen)?.id ?? organizations[0]?.id ?? null;

  const setOrganizationId = useCallback((id: string) => {
    setChosen(id);
    try {
      window.localStorage.setItem(ORG_KEY, id);
    } catch {}
  }, []);

  const membershipsInOrg = useMemo(
    () => me?.memberships.filter((m) => m.organization === organizationId) ?? [],
    [me, organizationId],
  );

  const can = useCallback(
    (perm: string) => membershipsInOrg.some((m) => m.permissions.includes(perm)),
    [membershipsInOrg],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Rechargement complet volontaire : vide tous les caches de données de la session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/connexion";
  }, []);

  return (
    <SessionContext.Provider
      value={{
        me,
        loading: isLoading,
        organizationId,
        setOrganizationId,
        organizations,
        membershipsInOrg,
        can,
        isPlatformAdmin: !!me?.is_superuser,
        refresh: mutate,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession doit être utilisé dans SessionProvider");
  return ctx;
}
