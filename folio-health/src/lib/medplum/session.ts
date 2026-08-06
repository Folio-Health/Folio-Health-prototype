import "server-only"

import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session"
import { medplumClientId, medplumUrl } from "./config"

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE }

/**
 * Medplum token session, held in httpOnly cookies.
 *
 * Replaces the prototype's `folio_session=1` cookie, which was set by client
 * JavaScript and only ever checked for existence. These cookies hold real
 * OAuth2 tokens, are unreadable from JavaScript, and are validated by Medplum
 * on every FHIR call.
 */

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

const isProduction = process.env.NODE_ENV === "production"

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    // The dev Medplum server is plain HTTP; requiring Secure in dev would stop
    // the cookie being stored at all. Always Secure once deployed.
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function storeTokens(tokens: TokenResponse): Promise<void> {
  const jar = await cookies()
  // Fall back to 1h — Medplum's default access token lifetime.
  jar.set(ACCESS_TOKEN_COOKIE, tokens.access_token, cookieOptions(tokens.expires_in ?? 3600))
  if (tokens.refresh_token) {
    jar.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, cookieOptions(60 * 60 * 24 * 14))
  }
}

export async function clearTokens(): Promise<void> {
  const jar = await cookies()
  jar.delete(ACCESS_TOKEN_COOKIE)
  jar.delete(REFRESH_TOKEN_COOKIE)
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies()
  return jar.get(ACCESS_TOKEN_COOKIE)?.value
}

/**
 * Outcome of a refresh attempt.
 *
 * "unreachable" is kept distinct from "expired" on purpose. Both used to
 * collapse into "no token", so a dropped connection was indistinguishable from
 * a dead session — and the app would sign a clinician out mid-shift because the
 * network blinked. A blip must never destroy credentials.
 */
export type RefreshResult =
  | { status: "ok"; accessToken: string }
  | { status: "expired" }
  | { status: "unreachable" }

/** Exchange the refresh token for a new access token. Never throws. */
export async function refreshSession(): Promise<RefreshResult> {
  const jar = await cookies()
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return { status: "expired" }

  let response: Response
  try {
    response = await fetch(medplumUrl("oauth2/token"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: medplumClientId(),
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    })
  } catch (error) {
    // Network failure (EHOSTUNREACH, DNS, timeout). Keep the tokens: they are
    // probably still valid and the server is simply not reachable right now.
    console.error("[medplum] token refresh could not reach the server", error)
    return { status: "unreachable" }
  }

  if (!response.ok) {
    // The server answered and rejected the token — this session really is over.
    await clearTokens()
    return { status: "expired" }
  }

  const tokens = (await response.json()) as TokenResponse
  await storeTokens(tokens)
  return { status: "ok", accessToken: tokens.access_token }
}

/**
 * Convenience wrapper for callers that only need the token.
 * Prefer `refreshSession` where "unreachable" and "expired" should differ.
 */
export async function refreshAccessToken(): Promise<string | undefined> {
  const result = await refreshSession()
  return result.status === "ok" ? result.accessToken : undefined
}
