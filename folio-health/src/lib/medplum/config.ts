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
