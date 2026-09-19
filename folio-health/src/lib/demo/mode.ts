/**
 * Demo mode: run the whole app with NO Medplum server.
 *
 * Turned on with `FOLIO_DEMO_MODE=1` in `.env.local`. Every place that would
 * otherwise call Medplum — sign-in, /api/auth/me, the FHIR proxy, the admin
 * plane — branches to an in-memory, faker-seeded FHIR store instead (see
 * `./store.ts`). Nothing leaves the machine, so it works on any network.
 *
 * Deliberately free of `server-only`: the flag itself is harmless, and keeping
 * this module import-light lets the edge proxy use it if it ever needs to. The
 * env var has no NEXT_PUBLIC_ prefix, so the browser never sees it — all
 * branching happens server-side.
 */

export function isDemoMode(): boolean {
  const value = process.env.FOLIO_DEMO_MODE
  return value === "1" || value === "true"
}

/**
 * Demo sessions reuse the real ACCESS_TOKEN_COOKIE so the edge proxy's
 * "is there a session" check keeps working unchanged. The prefix is what
 * distinguishes a demo token from a real Medplum OAuth2 token; what follows
 * it is the id of the Practitioner the session belongs to.
 *
 * Any account in the demo store can sign in — the three seeded personas
 * (operator@demo.folio, admin@demo.folio, doctor@demo.folio) AND every account
 * provisioned through the app (a facility's hospital admin created by the
 * operator, staff created by that admin). That keeps the RBAC chain identical
 * to production: the role comes from the Practitioner's role identifier, the
 * facility from its membership binding, never from the sign-in email. See
 * `demoSignIn` in ./store.ts for the email → account lookup.
 */
export const DEMO_TOKEN_PREFIX = "folio-demo:"

export function demoTokenForUser(practitionerId: string): string {
  return DEMO_TOKEN_PREFIX + practitionerId
}

/** The Practitioner id a demo session cookie encodes, or null when it is not one. */
export function demoUserIdFromToken(token: string | undefined): string | null {
  if (!token?.startsWith(DEMO_TOKEN_PREFIX)) return null
  const id = token.slice(DEMO_TOKEN_PREFIX.length)
  return id.length > 0 ? id : null
}
