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
 * Who the demo session pretends to be. Picked from the sign-in email so a
 * teammate can exercise both planes without any provisioning:
 *
 *   - an email containing "operator" or "platform" → the platform operator
 *   - an email containing "doctor"                 → a facility doctor
 *   - anything else                                → the facility administrator
 */
export type DemoPersona = "operator" | "facility-admin" | "doctor"

/**
 * Demo sessions reuse the real ACCESS_TOKEN_COOKIE so the edge proxy's
 * "is there a session" check keeps working unchanged. The prefix is what
 * distinguishes a demo token from a real Medplum OAuth2 token.
 */
export const DEMO_TOKEN_PREFIX = "folio-demo:"

export function demoPersonaForEmail(email: string): DemoPersona {
  const normalized = email.toLowerCase()
  if (normalized.includes("operator") || normalized.includes("platform")) return "operator"
  if (normalized.includes("doctor")) return "doctor"
  return "facility-admin"
}

/** The persona a demo session cookie encodes, or null when it is not one. */
export function demoPersonaFromToken(token: string | undefined): DemoPersona | null {
  if (!token?.startsWith(DEMO_TOKEN_PREFIX)) return null
  const persona = token.slice(DEMO_TOKEN_PREFIX.length)
  return persona === "operator" || persona === "facility-admin" || persona === "doctor"
    ? persona
    : null
}
