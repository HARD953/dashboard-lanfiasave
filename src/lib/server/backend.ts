import "server-only";

/** API de production (domaine stable Vercel, suit chaque nouveau déploiement du backend). */
export const PRODUCTION_API_URL = "https://backend-lanfiasave-uwy5.vercel.app/api/v1";

/**
 * URL de l'API Django vue depuis le serveur Next.js (jamais exposée au navigateur).
 * En local, définir API_INTERNAL_URL=http://localhost:8000/api/v1 dans .env.local.
 */
export const BACKEND_URL = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  PRODUCTION_API_URL
).replace(/\/$/, "");

export const ACCESS_COOKIE = "lfs_access";
export const REFRESH_COOKIE = "lfs_refresh";

const secure = process.env.NODE_ENV === "production";

export const accessCookie = (value: string) => ({
  name: ACCESS_COOKIE,
  value,
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 60,
});

export const refreshCookie = (value: string) => ({
  name: REFRESH_COOKIE,
  value,
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 3600,
});
