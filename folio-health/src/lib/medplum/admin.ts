import "server-only"

import { medplumUrl } from "./config"
import { getAccessToken, refreshSession } from "./session"

/**
 * Privileged platform-plane operations.
 *
 * These call Medplum endpoints OUTSIDE `/fhir/R4` (`admin/projects/.../invite`),
 * which the FHIR proxy deliberately refuses to forward. They live here, behind
 * an explicit platform-admin check, rather than widening that proxy.
 *
 * Every call uses the SIGNED-IN OPERATOR'S OWN token — never a stored service
 * credential — so Medplum authorises the action against that person, and the
 * resulting AuditEvent attributes it to them.
 */

export class AdminError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "AdminError"
    this.status = status
  }
}

const UNREACHABLE_MESSAGE = "Can't reach Folio right now. Check your connection and try again."

async function tokenOrThrow(): Promise<string> {
  const existing = await getAccessToken()
  if (existing) return existing

  const refreshed = await refreshSession()
  // 503, not 401 — an unreachable server must never present as a sign-out.
  if (refreshed.status === "unreachable") throw new AdminError(UNREACHABLE_MESSAGE, 503)
  if (refreshed.status === "expired") throw new AdminError("Not authenticated.", 401)
  return refreshed.accessToken
}

/** Authenticated call to any Medplum path, retrying once after a token refresh. */
export async function medplumFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let token = await tokenOrThrow()

  const send = (accessToken: string) =>
    fetch(medplumUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

  let response: Response
  try {
    response = await send(token)
    if (response.status === 401) {
      const refreshed = await refreshSession()
      if (refreshed.status === "unreachable") throw new AdminError(UNREACHABLE_MESSAGE, 503)
      if (refreshed.status === "expired") throw new AdminError("Session expired.", 401)
      token = refreshed.accessToken
      response = await send(token)
    }
  } catch (error) {
    if (error instanceof AdminError) throw error
    // Network failure reaching Medplum.
    console.error("[medplum-admin] request could not reach the server", error)
    throw new AdminError(UNREACHABLE_MESSAGE, 503)
  }

  if (!response.ok) {
    let detail: string | undefined
    try {
      const body = await response.json()
      detail = body?.issue?.[0]?.details?.text ?? body?.error_description ?? body?.error
    } catch {
      // Non-JSON error body.
    }
    throw new AdminError(detail ?? `Request failed (${response.status})`, response.status)
  }

  // 204 and friends carry no body.
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

interface AuthMe {
  project?: { id?: string; name?: string }
  membership?: { admin?: boolean }
}

/**
 * Assert the caller is a platform administrator and return the project id.
 *
 * `ProjectMembership.admin` is server-held and cannot be edited by the user, so
 * it is the only acceptable gate here. Medplum would reject an unauthorised
 * invite anyway — this check exists so the app fails with a clear 403 instead
 * of leaking a confusing upstream error.
 */
export async function requirePlatformAdmin(): Promise<{ projectId: string }> {
  const me = await medplumFetch<AuthMe>("auth/me")
  if (!me.membership?.admin) {
    throw new AdminError("This action requires a platform administrator account.", 403)
  }
  const projectId = me.project?.id
  if (!projectId) throw new AdminError("Could not determine the project.", 500)
  return { projectId }
}

interface Bundle<T> {
  entry?: { resource?: T }[]
}

/**
 * Look up an AccessPolicy by name.
 *
 * Policies are authored and installed by the platform's own provisioning
 * tooling (packages/fhir-model + setup-medplum-tenancy). This app REFERENCES
 * them and never rebuilds them: duplicating policy-authoring logic in a second
 * codebase is how two definitions of "what a facility admin may read" drift
 * apart, and a drift there is a data breach.
 */
export async function findAccessPolicyByName(
  name: string
): Promise<{ id: string; name: string }> {
  const bundle = await medplumFetch<Bundle<{ id?: string; name?: string }>>(
    `fhir/R4/AccessPolicy?name=${encodeURIComponent(name)}&_count=10`
  )
  const match = (bundle.entry ?? [])
    .map((e) => e.resource)
    .find((p) => p?.name === name && p.id)
  if (!match?.id) {
    throw new AdminError(
      `Access policy "${name}" is not installed. Run the platform provisioning setup first.`,
      500
    )
  }
  return { id: match.id, name: match.name ?? name }
}

/** Stable names of the installed policies this app binds users to. */
export const FACILITY_ADMIN_ACCESS_POLICY_NAME = "Folio Facility Admin Access Policy"

export interface FacilityMembership {
  id: string
  profileReference?: string
  practitionerId?: string
  name: string
  /** Whether the membership is currently usable. Absent field means active. */
  active: boolean
  admin: boolean
}

/**
 * Every ProjectMembership scoped to a facility.
 *
 * Medplum has no search parameter for "access[].parameter value", so this pages
 * through memberships and filters in code. Fine at facility-network scale; if
 * the project ever holds more than PAGE_LIMIT memberships this must move to a
 * server-side index rather than silently truncating.
 */
const MEMBERSHIP_PAGE_LIMIT = 1000

export async function findMembershipsForFacility(
  organizationId: string
): Promise<{ memberships: FacilityMembership[]; truncated: boolean }> {
  const reference = `Organization/${organizationId}`
  const bundle = await medplumFetch<{
    total?: number
    entry?: {
      resource?: {
        id?: string
        active?: boolean
        admin?: boolean
        profile?: { reference?: string; display?: string }
        access?: { parameter?: { name?: string; valueReference?: { reference?: string } }[] }[]
      }
    }[]
  }>(`fhir/R4/ProjectMembership?_count=${MEMBERSHIP_PAGE_LIMIT}&_total=accurate`)

  const all = (bundle.entry ?? []).map((e) => e.resource).filter(Boolean)
  const memberships = all
    .filter((m) =>
      (m!.access ?? []).some((a) =>
        (a.parameter ?? []).some(
          (p) => p.name === "organization" && p.valueReference?.reference === reference
        )
      )
    )
    .map((m) => ({
      id: m!.id ?? "",
      profileReference: m!.profile?.reference,
      practitionerId: m!.profile?.reference?.startsWith("Practitioner/")
        ? m!.profile.reference.split("/")[1]
        : undefined,
      name: m!.profile?.display ?? m!.profile?.reference ?? "Unknown account",
      active: m!.active !== false,
      admin: Boolean(m!.admin),
    }))

  return {
    memberships,
    truncated: (bundle.total ?? all.length) > all.length,
  }
}

/** Enable or disable a single membership. Returns true when it changed. */
export async function setMembershipActive(
  membershipId: string,
  active: boolean
): Promise<boolean> {
  const current = await medplumFetch<Record<string, unknown> & { active?: boolean }>(
    `fhir/R4/ProjectMembership/${encodeURIComponent(membershipId)}`
  )
  if ((current.active !== false) === active) return false
  await medplumFetch(`fhir/R4/ProjectMembership/${encodeURIComponent(membershipId)}`, {
    method: "PUT",
    body: JSON.stringify({ ...current, active }),
  })
  return true
}
