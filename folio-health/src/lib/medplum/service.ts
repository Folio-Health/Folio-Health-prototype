import "server-only"

import type { Practitioner } from "@medplum/fhirtypes"
import { TEMP_CREDENTIAL_EXTENSION_URL } from "@/lib/auth/roles"
import { medplumServiceCredentials, medplumUrl } from "./config"

/**
 * The service identity that clears first-login credential flags.
 *
 * This is the ONLY code path in the app that acts without a signed-in human, and
 * it exists because the user's own session provably cannot do this job: Medplum
 * revokes all Logins on `/auth/changepassword`, and the re-login that follows is
 * refused `Bot/$execute` (Folio-Web `docs/forced-change-findings.md`, walls #2
 * and #3). Something outside that session has to clear the flag, or every user
 * who sets a permanent password is asked to set another one forever.
 *
 * Scope is deliberately one function: strip one extension from one Practitioner.
 * It never reads clinical data, never creates accounts, and never grants roles.
 */

/** Distinguishes "we could not clear it" from "there was nothing to clear". */
export type ClearFlagResult =
  | { status: "cleared" }
  | { status: "not-set" }
  | { status: "unavailable"; reason: string }
  | { status: "failed"; reason: string }

interface TokenResponse {
  access_token?: string
  expires_in?: number
}

/**
 * Cached service token.
 *
 * Module scope is per server instance, so this is a cache and never the source
 * of truth — a cold start or a second instance simply mints a new one.
 */
let cachedToken: { value: string; expiresAt: number } | null = null

/** Mint (or reuse) a client_credentials access token. */
export async function getServiceToken(): Promise<
  { ok: true; token: string } | { ok: false; reason: string }
> {
  const credentials = medplumServiceCredentials()
  if (!credentials) {
    return {
      ok: false,
      reason:
        "MEDPLUM_SERVICE_CLIENT_ID / MEDPLUM_SERVICE_CLIENT_SECRET are not set, so the " +
        "first-login flag cannot be cleared automatically.",
    }
  }

  // 30s of slack so a token that is about to expire is not handed out.
  if (cachedToken && cachedToken.expiresAt - 30_000 > Date.now()) {
    return { ok: true, token: cachedToken.value }
  }

  let response: Response
  try {
    response = await fetch(medplumUrl("oauth2/token"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
      cache: "no-store",
    })
  } catch (error) {
    console.error("[medplum-service] token request could not reach the server", error)
    return { ok: false, reason: "Could not reach Folio to authorise the credential update." }
  }

  if (!response.ok) {
    // Never log the secret or the body — a bad-credentials response can echo it.
    console.error("[medplum-service] token request rejected:", response.status)
    return {
      ok: false,
      reason: "The Folio service account was rejected. Check its client id and secret.",
    }
  }

  const tokens = (await response.json()) as TokenResponse
  if (!tokens.access_token) {
    return { ok: false, reason: "The Folio service account returned no access token." }
  }

  cachedToken = {
    value: tokens.access_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  }
  return { ok: true, token: cachedToken.value }
}

async function serviceFetch(path: string, init: RequestInit = {}) {
  const token = await getServiceToken()
  if (!token.ok) return token

  const response = await fetch(medplumUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
      Authorization: `Bearer ${token.token}`,
    },
    cache: "no-store",
  })
  return { ok: true as const, response }
}

/**
 * Remove the temp-credential flag from a Practitioner.
 *
 * Idempotent: clearing an already-clear Practitioner reports "not-set" rather
 * than failing, so a retry after a partial failure is always safe.
 *
 * Read-then-write rather than PATCH: the flag lives in `extension[]`, and a
 * blind PATCH by array index would drop whichever unrelated extension happened
 * to share that slot.
 */
export async function clearTempCredentialFlag(practitionerId: string): Promise<ClearFlagResult> {
  try {
    const read = await serviceFetch(`fhir/R4/Practitioner/${encodeURIComponent(practitionerId)}`)
    if (!read.ok) return { status: "unavailable", reason: read.reason }
    if (!read.response.ok) {
      return {
        status: "failed",
        reason: `Could not read the practitioner record (${read.response.status}).`,
      }
    }

    const practitioner = (await read.response.json()) as Practitioner
    const kept = (practitioner.extension ?? []).filter(
      (e) => e.url !== TEMP_CREDENTIAL_EXTENSION_URL
    )
    if (kept.length === (practitioner.extension ?? []).length) {
      return { status: "not-set" }
    }

    const write = await serviceFetch(`fhir/R4/Practitioner/${encodeURIComponent(practitionerId)}`, {
      method: "PUT",
      // Omit `extension` entirely when nothing else remains: an empty array is
      // invalid FHIR and Medplum rejects it.
      body: JSON.stringify({
        ...practitioner,
        extension: kept.length ? kept : undefined,
      }),
    })
    if (!write.ok) return { status: "unavailable", reason: write.reason }
    if (!write.response.ok) {
      return {
        status: "failed",
        reason: `Could not save the practitioner record (${write.response.status}).`,
      }
    }

    return { status: "cleared" }
  } catch (error) {
    console.error("[medplum-service] clearing the temp-credential flag failed", error)
    return { status: "failed", reason: "Could not reach Folio to update the credential flag." }
  }
}
