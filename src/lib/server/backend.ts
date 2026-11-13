import "server-only";

/** URL de l'API Django vue depuis le serveur Next.js (jamais exposée au navigateur). */
export const BACKEND_URL = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1"
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
