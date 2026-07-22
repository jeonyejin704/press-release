import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware handles the entry-point redirect with a clean, bodyless 307
// so all browsers/proxies (e.g. GitHub Codespaces port forwarding) follow it
// reliably — unlike a Server Component redirect() at "/", which streams a
// not-found body alongside the redirect and can be mis-rendered by some
// proxies/mobile browsers.
//
// We intentionally do NOT redirect "/login" here: doing so could create a
// redirect loop if the browser holds a session cookie for a user that no
// longer exists (e.g. after a DB reseed). /login must always be reachable so
// the user can re-authenticate.

const SESSION_COOKIE = "pf_session";
const ROLE_COOKIE = "pf_role";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname !== "/") return NextResponse.next();

  const hasSession = req.cookies.has(SESSION_COOKIE);
  const role = req.cookies.get(ROLE_COOKIE)?.value;
  const url = req.nextUrl.clone();
  url.pathname = !hasSession ? "/login" : role === "APPLICANT" ? "/requests" : "/dashboard";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
