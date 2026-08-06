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
 * Exchange the refresh token for a new access token. Returns the new access
 * token, or undefined when there is no usable refresh token — in which case the
 * caller should treat the session as ended.
 */
export async function refreshAccessToken(): Promise<string | undefined> {
  const jar = await cookies()
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return undefined

  const response = await fetch(medplumUrl("oauth2/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: medplumClientId(),
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    await clearTokens()
    return undefined
  }

  const tokens = (await response.json()) as TokenResponse
  await storeTokens(tokens)
  return tokens.access_token
}
