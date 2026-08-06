import { NextResponse, type NextRequest } from "next/server"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session"

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // A live access token, or a refresh token the API routes can still redeem.
  // Presence is only a routing hint — Medplum validates the token itself on
  // every FHIR call, so a forged cookie gets a user precisely nowhere.
  const isAuthenticated =
    request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE)
  const isPublic = PUBLIC_PATHS.includes(pathname)

  // Internal system: "/" is not a landing page, it's a routing decision.
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = isAuthenticated ? "/dashboard" : "/login"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
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
