import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware handles entry-point redirects with a clean, bodyless 307 so
// that all browsers and proxies (e.g. GitHub Codespaces port forwarding)
// follow them reliably — unlike a Server Component `redirect()` at "/", which
// streams a not-found body alongside the redirect and can be mis-rendered by
// some proxies/mobile browsers.

const SESSION_COOKIE = "pf_session";
const ROLE_COOKIE = "pf_role";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const role = req.cookies.get(ROLE_COOKIE)?.value;

  // Landing page: route by auth + role.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    if (!hasSession) {
      url.pathname = "/login";
    } else {
      url.pathname = role === "APPLICANT" ? "/requests" : "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Already logged in but on /login → send into the app.
  if (pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = role === "APPLICANT" ? "/requests" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on the entry points; app pages keep their own guards.
  matcher: ["/", "/login"],
};
