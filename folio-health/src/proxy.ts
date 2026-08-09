import { NextResponse, type NextRequest } from "next/server"
import {
  ACCESS_TOKEN_COOKIE,
  MUST_CHANGE_PASSWORD_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SET_PASSWORD_PATH,
} from "@/lib/session"

// Internal system: no self-registration. Accounts are provisioned in Medplum by
// a facility administrator, so there is no public /signup route.
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/otp-verification",
  "/two-factor",
  "/session-expired",
]

const AUTH_FORM_PATHS = ["/login"]

/**
 * Pages a user still on their first-login temporary password may reach.
 *
 * Deliberately tiny, and an allow-list rather than a deny-list: a module added
 * anywhere else in the app is unreachable on a temporary credential by default,
 * instead of being exposed until someone remembers to block it.
 *
 * `/api/*` is absent because the matcher below never runs the proxy on it. API
 * routes authorise themselves; `/api/fhir/*` carries its own temp-credential
 * check so data access is closed off too, not just navigation.
 */
const TEMP_CREDENTIAL_ALLOWED = [SET_PASSWORD_PATH, "/session-expired"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // A live access token, or a refresh token the API routes can still redeem.
  // Presence is only a routing hint — Medplum validates the token itself on
  // every FHIR call, so a forged cookie gets a user precisely nowhere.
  const isAuthenticated =
    request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE)
  const isPublic = PUBLIC_PATHS.includes(pathname)

  const mustChangePassword = isAuthenticated && request.cookies.has(MUST_CHANGE_PASSWORD_COOKIE)

  // Internal system: "/" is not a landing page, it's a routing decision.
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = mustChangePassword ? SET_PASSWORD_PATH : isAuthenticated ? "/dashboard" : "/login"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  /**
   * A temporary password grants exactly one power: replacing itself.
   *
   * Checked before the "already signed in" redirect below, so a user mid-change
   * cannot reach /dashboard by navigating to /login and being bounced onward.
   *
   * The cookie is a routing hint, not the authority (see lib/session.ts). It is
   * derived from the Practitioner's `temp-credential` extension at sign-in and
   * cleared when the change succeeds. Deleting it by hand only skips a redirect:
   * the pages behind it still read /api/auth/me, which re-reads the real flag.
   */
  if (mustChangePassword) {
    const allowed = TEMP_CREDENTIAL_ALLOWED.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    )
    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = SET_PASSWORD_PATH
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Nothing to change — the password page has no reason to render.
  if (isAuthenticated && pathname === SET_PASSWORD_PATH) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && AUTH_FORM_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Excluded by PREFIX, never by file extension.
   *
   * The previous matcher excluded any path ending in .json/.txt/.xml/etc. That
   * is an unanchored suffix rule applied to the whole path, so a future route
   * like /patients/export.json would have silently bypassed the auth check.
   *
   * `api` is excluded because those routes authenticate themselves — if the
   * proxy gated them, an unauthenticated POST to /api/auth/login would be
   * redirected to /login and sign-in could never happen.
   */
  matcher: [
    "/((?!api/|_next/|favicon\\.ico$|icon\\.svg$|apple-icon\\.png$|site\\.webmanifest$|favicon-|icon-|apple-touch-icon\\.png$).*)",
  ],
}
