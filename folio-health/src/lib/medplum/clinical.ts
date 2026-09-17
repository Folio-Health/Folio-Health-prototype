import "server-only"

import type { Resource } from "@medplum/fhirtypes"
import { facilityBindingsFromAuthMe, type AuthMeLike, type FacilityBinding } from "@/lib/auth/facility-binding"
import { FOLIO_ROLE_SYSTEM, type RoleId } from "@/lib/auth/roles"
import { AdminError, medplumFetch } from "./admin"

/**
 * Server-side plumbing for clinical writes.
 *
 * Every clinical resource a facility user creates (vitals, notes, orders,
 * results, dispenses) must land in the facility's compartment, and the
 * compartment stamp (`meta.account`) is a project-admin-only field — so, as
 * with patient registration and appointments, writes are performed with the
 * service identity AFTER the caller's session has been checked. These
 * helpers make that the only way to write:
 *
 *   clinicalSession()   who is calling: facility (trusted, from the compiled
 *                       policy), roles (from the Practitioner role tag), and
 *                       the Practitioner reference to record as performer.
 *   requireRole()       the role gate for the operation.
 *   assertVisible()     the record being written against must be readable
 *                       by the CALLER's own token — i.e. in their facility.
 *   stampedCreate()     create with meta.account = caller's facility.
 *   stampedUpdate()     read (service) → mutate → write, re-stamping the
 *                       facility so an admin write never clears it.
 *
 * Roles here are defence in depth: the role tag is ordinary FHIR data on the
 * Practitioner. The tenancy boundary is the facility binding, which the user
 * cannot edit.
 */

export interface ClinicalSession {
  facility: FacilityBinding | null
  isPlatformAdmin: boolean
  roles: RoleId[]
  practitionerRef?: string
  practitionerDisplay?: string
}

interface ProfileLike {
  resourceType?: string
  id?: string
  name?: { text?: string; given?: string[]; family?: string }[]
  identifier?: { system?: string; value?: string }[]
}

export async function clinicalSession(): Promise<ClinicalSession> {
  const me = await medplumFetch<AuthMeLike & { membership?: { admin?: boolean }; profile?: ProfileLike }>(
    "auth/me"
  )
  const profile = me.profile
  const roles = (profile?.identifier ?? [])
    .filter((i) => i.system === FOLIO_ROLE_SYSTEM && i.value)
    .map((i) => i.value as RoleId)
  const name = profile?.name?.[0]
  return {
    facility: facilityBindingsFromAuthMe(me)[0] ?? null,
    isPlatformAdmin: me.membership?.admin === true,
    roles,
    practitionerRef:
      profile?.resourceType === "Practitioner" && profile.id ? `Practitioner/${profile.id}` : undefined,
    practitionerDisplay:
      name?.text ?? ([name?.given?.join(" "), name?.family].filter(Boolean).join(" ") || undefined),
  }
}

/**
 * The caller must be a facility user holding one of `roles`. The platform
 * operator and the hospital administrator are deliberately NOT clinical
 * roles (spec §7.8: technical/administrative authority is not chart access).
 */
export function requireRole(session: ClinicalSession, roles: RoleId[], what: string): FacilityBinding {
  if (!session.facility) {
    throw new AdminError(`Your account is not bound to a facility, so it cannot ${what}.`, 403)
  }
  if (!session.roles.some((r) => roles.includes(r))) {
    throw new AdminError(`Your role is not permitted to ${what}.`, 403)
  }
  return session.facility
}

/**
 * The record must be readable by the caller's OWN token — which, under the
 * compartment-scoped policies, means it belongs to their facility. Returns
 * the resource so callers can use it without a second read.
 */
export async function assertVisible<T extends Resource>(reference: string): Promise<T> {
  if (!/^[A-Za-z]+\/[A-Za-z0-9\-.]{1,64}$/.test(reference)) {
    throw new AdminError("Invalid reference.", 400)
  }
  try {
    return await medplumFetch<T>(`fhir/R4/${reference}`)
  } catch (error) {
    if (error instanceof AdminError && (error.status === 403 || error.status === 404)) {
      throw new AdminError("That record is not at your facility.", 403)
    }
    throw error
  }
}

export async function stampedCreate<T extends Resource>(resource: T, facility: FacilityBinding): Promise<T> {
  const { meta: _ignored, id: _id, ...rest } = resource as T & { meta?: unknown; id?: string }
  void _ignored
  void _id
  return medplumFetch<T>(`fhir/R4/${resource.resourceType}`, {
    privileged: true,
    method: "POST",
    body: JSON.stringify({ ...rest, meta: { account: facility } }),
  })
}

export async function stampedUpdate<T extends Resource>(
  reference: string,
  mutate: (existing: T) => T,
  facility: FacilityBinding
): Promise<T> {
  const existing = await medplumFetch<T>(`fhir/R4/${reference}`, { privileged: true })
  const next = mutate(existing)
  const { meta: existingMeta } = existing as T & { meta?: Record<string, unknown> }
  return medplumFetch<T>(`fhir/R4/${reference}`, {
    privileged: true,
    method: "PUT",
    body: JSON.stringify({ ...next, meta: { ...(existingMeta ?? {}), account: facility } }),
  })
}

/** Search with the service identity (project-wide), for cross-checks. */
export async function privilegedSearch<T extends Resource>(query: string): Promise<T[]> {
  const bundle = await medplumFetch<{ entry?: { resource?: T }[] }>(`fhir/R4/${query}`, { privileged: true })
  return (bundle.entry ?? []).map((e) => e.resource).filter((r): r is T => Boolean(r))
}

/** Uniform error → response mapping for the clinical routes. */
export function clinicalErrorResponse(error: unknown, fallback: string) {
  if (error instanceof AdminError) {
    return { status: error.status, body: { error: error.message } }
  }
  console.error(`[clinical] ${fallback}`, error)
  return { status: 502, body: { error: fallback } }
}
