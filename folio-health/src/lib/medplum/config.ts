import "server-only"

/**
 * Server-side Medplum configuration.
 *
 * These values are deliberately NOT prefixed with NEXT_PUBLIC_. The browser
 * never speaks to Medplum directly — it calls this app's /api/fhir/* routes,
 * which attach the access token server-side. That keeps FHIR tokens out of
 * browser JavaScript and means the Medplum server's CORS allowlist does not
 * need to know about this app's origin.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    )
  }
  return value
}

/** Medplum base URL, always with a single trailing slash. */
export function medplumBaseUrl(): string {
  return required("MEDPLUM_BASE_URL").replace(/\/+$/, "") + "/"
}

/** Public ClientApplication id — an identifier, not a secret. */
export function medplumClientId(): string {
  return required("MEDPLUM_CLIENT_ID")
}

/** Absolute URL for a Medplum endpoint path (e.g. "fhir/R4/Patient"). */
export function medplumUrl(path: string): string {
  return medplumBaseUrl() + path.replace(/^\/+/, "")
}

/**
 * Service-account credentials for the ONE privileged action this app performs
 * without a signed-in human: clearing the `temp-credential` flag after a user
 * sets a permanent password.
 *
 * Why a service credential exists here at all, when `admin.ts` deliberately uses
 * the operator's own token for everything else:
 *
 * Medplum revokes every Login on `/auth/changepassword`, and the login created
 * by the subsequent re-login is refused `Bot/$execute` — so the user's own
 * session provably cannot clear its own flag (both confirmed empirically; see
 * Folio-Web `docs/forced-change-findings.md`, walls #2 and #3). Without an actor
 * independent of that session, a user who sets a permanent password is asked to
 * set another one forever.
 *
 * The credential is SERVER-SIDE ONLY — no `NEXT_PUBLIC_` prefix, and this module
 * is `server-only`. It is used for exactly one Practitioner write and never to
 * read clinical data or to act on a user's behalf.
 *
 * Optional by design: when unset, the app still runs and still forces the
 * change, but cannot auto-clear the flag. `/api/auth/change-password` reports
 * that plainly rather than leaving the user in a silent loop.
 */
export function medplumServiceCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.MEDPLUM_SERVICE_CLIENT_ID
  const clientSecret = process.env.MEDPLUM_SERVICE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}
