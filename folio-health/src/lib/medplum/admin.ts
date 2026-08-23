import "server-only"

import type { Practitioner } from "@medplum/fhirtypes"
import { FOLIO_ROLE_SYSTEM, TEMP_CREDENTIAL_EXTENSION_URL } from "@/lib/auth/roles"
import { facilityBindingsFromAuthMe } from "@/lib/auth/facility-binding"
import { demoUserIdFromToken, isDemoMode } from "@/lib/demo/mode"
import { getServiceToken } from "@/lib/medplum/service"
import { demoMedplumRequest } from "@/lib/demo/store"
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

/**
 * Options for `medplumFetch`.
 *
 * `privileged`: perform the call as the app's service identity instead of the
 * signed-in user. Medplum reserves a handful of operations for PROJECT admins —
 * `admin/projects/:id/invite`, and reading or writing `ProjectMembership` and
 * `AccessPolicy` — and a hospital administrator is deliberately NOT a project
 * admin (that flag is what grants the platform plane). So the app performs its
 * own authorisation (`requirePlatformAdmin` / `requireFacilityProvisioner`,
 * which pin a facility admin to their own facility) and then carries the
 * Medplum call out with the service account. Only ever pass this AFTER one of
 * those checks has passed. Falls back to the user's own token when no service
 * credentials are configured, which still works for the platform operator.
 */
export interface MedplumFetchOptions extends RequestInit {
  privileged?: boolean
}

/** Authenticated call to any Medplum path, retrying once after a token refresh. */
export async function medplumFetch<T>(
  path: string,
  init: MedplumFetchOptions = {}
): Promise<T> {
  // Demo mode: the whole admin plane runs against the in-memory store. The
  // signed-in account still gates it — `requirePlatformAdmin` sees
  // `membership.admin` only for the operator, and `requireFacilityProvisioner`
  // reads the membership's facility binding — so plane separation and the
  // "hospital admin provisions only their own facility" rule both hold.
  if (isDemoMode()) {
    const userId = demoUserIdFromToken(await getAccessToken())
    if (!userId) throw new AdminError("Not authenticated.", 401)
    const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined
    const result = demoMedplumRequest(init.method ?? "GET", path, body, userId)
    if (result.status >= 400) {
      const detail = (result.body as { issue?: { details?: { text?: string } }[]; error?: string })
      throw new AdminError(
        detail?.issue?.[0]?.details?.text ?? detail?.error ?? `Request failed (${result.status})`,
        result.status
      )
    }
    return result.body as T
  }

  const { privileged, ...requestInit } = init

  let asService = false
  let token: string
  if (privileged) {
    const service = await getServiceToken()
    if (service.ok) {
      asService = true
      token = service.token
    } else {
      console.warn("[medplum-admin] service identity unavailable, using the caller's own session:", service.reason)
      token = await tokenOrThrow()
    }
  } else {
    token = await tokenOrThrow()
  }

  const send = (accessToken: string) =>
    fetch(medplumUrl(path), {
      ...requestInit,
      headers: {
        "Content-Type": "application/json",
        ...requestInit.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

  let response: Response
  try {
    response = await send(token)
    // A service token is never refreshed through the user's session.
    if (response.status === 401 && !asService) {
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
    if (asService && response.status === 403) {
      // The service account exists but is not a project admin, so Medplum
      // refused the admin-plane operation. Name the fix rather than returning a
      // bare "Forbidden" the hospital admin can do nothing about.
      throw new AdminError(
        "The Folio service account is not allowed to manage accounts. A platform " +
          "operator must mark its project membership as admin in Medplum.",
        503
      )
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

/**
 * Assert the caller may provision staff for one specific facility.
 *
 * The privilege boundary for the facility plane, so it is checked against
 * signals the caller cannot edit:
 *
 *   - `ProjectMembership.admin` (server-held) — the platform operator, who may
 *     act on any facility.
 *   - Otherwise the membership's own `%organization` binding, which is what the
 *     AccessPolicy is parameterised with. It must MATCH the requested facility.
 *     Medplum's auth/me does not return `membership.access`, so the binding is
 *     read from the server-compiled `accessPolicy` it does return — see
 *     lib/auth/facility-binding.ts.
 *
 * The Practitioner role tag is deliberately NOT consulted: it is ordinary
 * mutable FHIR data, so a user who could PATCH their own Practitioner would
 * otherwise be able to award themselves the right to create accounts.
 *
 * Medplum would reject an unauthorised invite anyway — this exists so the app
 * fails with a clear 403 rather than leaking a confusing upstream error, and so
 * a facility admin can never provision INTO ANOTHER FACILITY.
 */
export async function requireFacilityProvisioner(
  facilityId: string
): Promise<{ projectId: string; isPlatformAdmin: boolean }> {
  const me = await medplumFetch<AuthMe & { membership?: { admin?: boolean } }>("auth/me")

  const projectId = me.project?.id
  if (!projectId) throw new AdminError("Could not determine the project.", 500)

  if (me.membership?.admin) return { projectId, isPlatformAdmin: true }

  const boundFacilities = facilityBindingsFromAuthMe(me).map((b) => b.reference)

  if (!boundFacilities.includes(`Organization/${facilityId}`)) {
    throw new AdminError(
      "You can only create staff accounts for your own facility.",
      403
    )
  }

  return { projectId, isPlatformAdmin: false }
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
  // AccessPolicy is readable only by project admins; callers have already
  // passed the app's own provisioning check.
  const bundle = await medplumFetch<Bundle<{ id?: string; name?: string }>>(
    `fhir/R4/AccessPolicy?name=${encodeURIComponent(name)}&_count=10`,
    { privileged: true }
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
  }>(`fhir/R4/ProjectMembership?_count=${MEMBERSHIP_PAGE_LIMIT}&_total=accurate`, {
    // ProjectMembership is a project-admin resource; a hospital admin's own
    // token cannot list it. Callers have passed requireFacilityProvisioner.
    privileged: true,
  })

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

export interface FacilityStaffMember extends FacilityMembership {
  email: string | null
  /** Folio role identifier, or null when provisioning never stamped one. */
  role: string | null
  /** Still on the first-login temporary password. */
  mustChangePassword: boolean
}

/**
 * Add each member's real Practitioner details to their membership.
 *
 * One batched `_id=` search rather than a read per member: a facility with fifty
 * staff would otherwise cost fifty round-trips to render one table.
 *
 * Enrichment is best-effort — if the search fails, memberships are still
 * returned with null details. A staff list that renders without emails beats a
 * page that fails to load.
 */
export async function enrichMembershipsWithPractitioners(
  memberships: FacilityMembership[]
): Promise<FacilityStaffMember[]> {
  const ids = memberships.map((m) => m.practitionerId).filter((id): id is string => Boolean(id))

  const blank = (m: FacilityMembership): FacilityStaffMember => ({
    ...m,
    email: null,
    role: null,
    mustChangePassword: false,
  })

  if (ids.length === 0) return memberships.map(blank)

  let practitioners: Practitioner[] = []
  try {
    const bundle = await medplumFetch<Bundle<Practitioner>>(
      `fhir/R4/Practitioner?_id=${encodeURIComponent(ids.join(","))}&_count=${ids.length}`,
      { privileged: true }
    )
    practitioners = (bundle.entry ?? [])
      .map((e) => e.resource)
      .filter((p): p is Practitioner => Boolean(p))
  } catch (error) {
    console.error("[medplum-admin] could not enrich staff with practitioner details", error)
    return memberships.map(blank)
  }

  const byId = new Map(practitioners.map((p) => [p.id, p]))

  return memberships.map((m) => {
    const practitioner = m.practitionerId ? byId.get(m.practitionerId) : undefined
    if (!practitioner) return blank(m)
    return {
      ...m,
      email: practitioner.telecom?.find((t) => t.system === "email")?.value ?? null,
      role:
        practitioner.identifier?.find((i) => i.system === FOLIO_ROLE_SYSTEM)?.value ?? null,
      mustChangePassword: Boolean(
        practitioner.extension?.some(
          (e) => e.url === TEMP_CREDENTIAL_EXTENSION_URL && e.valueBoolean === true
        )
      ),
    }
  })
}

/** Enable or disable a single membership. Returns true when it changed. */
export async function setMembershipActive(
  membershipId: string,
  active: boolean
): Promise<boolean> {
  const current = await medplumFetch<Record<string, unknown> & { active?: boolean }>(
    `fhir/R4/ProjectMembership/${encodeURIComponent(membershipId)}`,
    { privileged: true }
  )
  if ((current.active !== false) === active) return false
  await medplumFetch(`fhir/R4/ProjectMembership/${encodeURIComponent(membershipId)}`, {
    method: "PUT",
    body: JSON.stringify({ ...current, active }),
    privileged: true,
  })
  return true
}
