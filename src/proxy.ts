import { NextResponse, type NextRequest } from "next/server";

/** Vérification optimiste : sans session, les espaces métier renvoient vers la connexion. */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("lfs_refresh");
  if (!hasSession) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/beneficiaires/:path*",
    "/programmes/:path*",
    "/instruction/:path*",
    "/recours/:path*",
    "/audit/:path*",
    "/operations/:path*",
    "/aides/:path*",
    "/administration/:path*",
  ],
};
