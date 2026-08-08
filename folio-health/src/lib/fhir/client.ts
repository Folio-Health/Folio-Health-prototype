"use client"

import type { Bundle, OperationOutcome, Resource } from "@medplum/fhirtypes"

/**
 * Browser-side FHIR client.
 *
 * Talks to this app's own `/api/fhir/*` routes, never to Medplum directly. The
 * access token is attached server-side from an httpOnly cookie, so nothing here
 * handles credentials and there is no CORS involved.
 */

const FHIR_BASE = "/api/fhir"

export class FhirError extends Error {
  readonly status: number
  readonly outcome?: OperationOutcome

  constructor(message: string, status: number, outcome?: OperationOutcome) {
    super(message)
    this.name = "FhirError"
    this.status = status
    this.outcome = outcome
  }

  /** The session ended or was never established. */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }

  /**
   * Folio could not be reached. Distinct from `isUnauthenticated` so a dropped
   * connection is never treated as a sign-out — the session is probably fine.
   */
  get isUnreachable(): boolean {
    return this.status === 503
  }
}

async function toError(response: Response): Promise<FhirError> {
  let outcome: OperationOutcome | undefined
  let message: string | undefined
  try {
    const body = await response.json()
    if (body?.resourceType === "OperationOutcome") {
      outcome = body as OperationOutcome
      message = outcome.issue?.[0]?.details?.text ?? outcome.issue?.[0]?.diagnostics
    } else if (typeof body?.error === "string") {
      message = body.error
    }
  } catch {
    // Non-JSON error body — fall through to the generic message.
  }
  return new FhirError(message ?? `FHIR request failed (${response.status})`, response.status, outcome)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${FHIR_BASE}/${path}`, {
    ...init,
    headers: { Accept: "application/fhir+json", ...init?.headers },
  })
  if (!response.ok) throw await toError(response)
  return (await response.json()) as T
}

/**
 * Search a resource type. Values that are undefined/empty are dropped.
 *
 * Pass an array to repeat a parameter, which FHIR treats as AND — e.g.
 * `{ date: ["ge2026-01-01", "le2026-01-31"] }` is "on or after AND on or
 * before". Joining those with a comma instead would mean OR, and silently
 * match everything.
 */
export type SearchParams = Record<string, string | number | (string | number)[] | undefined>

export async function searchResources<T extends Resource>(
  resourceType: string,
  params: SearchParams = {}
): Promise<{ resources: T[]; total?: number }> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== "") query.append(key, String(item))
      }
    } else {
      query.set(key, String(value))
    }
  }
  const search = query.toString()
  const bundle = await request<Bundle<T>>(`${resourceType}${search ? `?${search}` : ""}`)
  return {
    resources: (bundle.entry ?? []).map((e) => e.resource).filter((r): r is T => Boolean(r)),
    total: bundle.total,
  }
}

export async function readResource<T extends Resource>(resourceType: string, id: string): Promise<T> {
  return request<T>(`${resourceType}/${encodeURIComponent(id)}`)
}

export async function createResource<T extends Resource>(resource: T): Promise<T> {
  return request<T>(resource.resourceType, {
    method: "POST",
    headers: { "Content-Type": "application/fhir+json" },
    body: JSON.stringify(resource),
  })
}

export async function updateResource<T extends Resource & { id?: string }>(resource: T): Promise<T> {
  if (!resource.id) throw new Error("updateResource requires a resource with an id")
  return request<T>(`${resource.resourceType}/${encodeURIComponent(resource.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/fhir+json" },
    body: JSON.stringify(resource),
  })
}
