import { NextResponse } from "next/server";
import { BACKEND_URL, accessCookie, refreshCookie } from "@/lib/server/backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const res = await fetch(`${BACKEND_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
    },
    body: JSON.stringify({ username: body.username, password: body.password }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(accessCookie(data.access));
  response.cookies.set(refreshCookie(data.refresh));
  return response;
}
