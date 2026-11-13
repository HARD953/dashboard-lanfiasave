/**
 * Relais authentifié vers l'API Django (backend-for-frontend).
 * Le jeton JWT reste dans un cookie httpOnly : le code du navigateur n'y a jamais accès.
 * Un jeton expiré est renouvelé une fois de manière transparente.
 */
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  BACKEND_URL,
  REFRESH_COOKIE,
  accessCookie,
  refreshCookie,
} from "@/lib/server/backend";

async function forward(request: NextRequest, path: string[], token?: string) {
  const url = `${BACKEND_URL}/${path.map(encodeURIComponent).join("/")}/${request.nextUrl.search}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const idem = request.headers.get("idempotency-key");
  if (idem) headers["Idempotency-Key"] = idem;
  if (token) headers.Authorization = `Bearer ${token}`;
  const hasBody = !["GET", "HEAD"].includes(request.method);
  return fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.clone().arrayBuffer() : undefined,
    cache: "no-store",
  });
}

async function handler(request: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  let renewed: { access: string; refresh?: string } | null = null;

  let res = await forward(request, path, access);
  if (res.status === 401 && refresh) {
    const r = await fetch(`${BACKEND_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
    if (r.ok) {
      renewed = await r.json();
      access = renewed!.access;
      res = await forward(request, path, access);
    }
  }

  const body = await res.arrayBuffer();
  const out = new NextResponse(res.status === 204 ? null : body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
  if (renewed) {
    out.cookies.set(accessCookie(renewed.access));
    if (renewed.refresh) out.cookies.set(refreshCookie(renewed.refresh));
  }
  if (res.status === 401) {
    out.cookies.delete(ACCESS_COOKIE);
    out.cookies.delete(REFRESH_COOKIE);
  }
  return out;
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
