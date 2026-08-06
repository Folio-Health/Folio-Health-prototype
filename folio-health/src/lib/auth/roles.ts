/**
 * RBAC roles and the nav each may see (architecture §7).
 *
 * Two planes, deliberately separate:
 *   - Platform plane (operator). Onboards facilities and creates hospital
 *     admins. Runs the network, not the chart. **No clinical content** — the
 *     operator cannot browse patient data (CLAUDE.md principle 7).
 *   - Facility plane (hospital admin). Provisions the clinical roles — doctor,
 *     nurse, front desk, lab, finance — for their own facility only.
 *
 * Roles come from the signed-in identity, never from a UI switcher.
 *
 * TRUST MODEL — this is the privilege boundary, so read carefully.
 * The Folio role tag on a Practitioner is ordinary, mutable FHIR data: a user
 * who can PATCH their own Practitioner could award themselves any tag. So tags
 * are treated as UNTRUSTED claims and reconciled against signals the user
 * cannot edit:
 *   - `ProjectMembership.admin` (server-held) is the ONLY thing that grants the
 *     platform plane. A `platform-admin` tag without it is refused.
 *   - Facility roles require a facility binding.
 */

export type RoleId =
  | "platform-admin"
  | "facility-admin"
  | "doctor"
  | "nurse"
  | "front-desk"
  | "him-officer"

/**
 * Role system written onto the Practitioner by provisioning.
 *
 * It is a Practitioner **identifier** (`.../sid/role` — a system identifier),
 * not a `meta.tag`. Provisioning writes
 * `identifier: [{ system: FOLIO_ROLE_SYSTEM, value: <roleId> }]`.
 */
export const FOLIO_ROLE_SYSTEM = "https://folio.health/fhir/sid/role"

/**
 * Marks a first-login temporary credential. Set by provisioning and cleared by
 * the privileged credential Bot after a real password change — never by the
 * user, who cannot write their own Practitioner.
 */
export const TEMP_CREDENTIAL_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/temp-credential"

const KNOWN_ROLES: RoleId[] = [
  "platform-admin",
  "facility-admin",
  "doctor",
  "nurse",
  "front-desk",
  "him-officer",
]

export function isRoleId(value: string): value is RoleId {
  return (KNOWN_ROLES as string[]).includes(value)
}

export const ROLE_LABELS: Record<RoleId, string> = {
  "platform-admin": "Super admin",
  "facility-admin": "Hospital admin",
  doctor: "Doctor",
  nurse: "Nurse",
  "front-desk": "Front desk",
  "him-officer": "HIM officer",
}

/**
 * Reconcile untrusted role tags against trusted signals.
 *
 * @param tags           role tags read off the Practitioner (untrusted)
 * @param isProjectAdmin ProjectMembership.admin (trusted, server-held)
 * @param hasFacility    whether the membership binds the user to a facility
 */
export function reconcileRoles(
  tags: string[],
  isProjectAdmin: boolean,
  hasFacility: boolean
): RoleId[] {
  const claimed = tags.filter(isRoleId)

  // The platform plane is granted ONLY by the server-held admin flag. A tag
  // claiming it without the flag is a self-promotion attempt — refuse it.
  const platform = isProjectAdmin ? (["platform-admin"] as RoleId[]) : []
  if (!isProjectAdmin && claimed.includes("platform-admin")) {
    console.warn("[folio-auth] refusing a platform-admin role tag without ProjectMembership.admin")
  }

  const facilityRoles = claimed.filter((r) => r !== "platform-admin")

  // A facility role is meaningless without a facility to scope it to.
  const effective = [...platform, ...(hasFacility ? facilityRoles : [])]

  if (effective.length > 0) return Array.from(new Set(effective))

  // No usable role. Project admins are the platform plane and nothing more.
  if (isProjectAdmin) return ["platform-admin"]

  // Unprovisioned staff: no role tag and no facility binding yet. They get an
  // empty role set, which is NOT a lockout — only the platform plane is
  // restricted, so these users keep the full facility nav. That is deliberately
  // permissive because no user on this server is provisioned yet; once role
  // tags exist, tighten this to deny by default.
  //
  // PROVISIONING GAP, not a decision. The real boundary is the server-side
  // AccessPolicy, which does not depend on this function at all.
  return []
}

/** True when the user holds only the platform plane (no clinical role). */
export function isPlatformOnly(roles: RoleId[]): boolean {
  return roles.includes("platform-admin") && roles.length === 1
}

/**
 * Nav hrefs the platform plane may see. Everything else in the sidebar is
 * clinical or facility-operational and is hidden from the operator.
 *
 * Deliberately an allow-list: a new clinical module added to nav.ts is hidden
 * from the operator by default, rather than exposed until someone remembers to
 * deny it.
 */
export const PLATFORM_NAV_HREFS: string[] = [
  // The operator's dashboard is the PLATFORM overview (no clinical figures) —
  // see PlatformDashboard. Omitting it here locked the operator out of their
  // own landing page.
  "/dashboard",
  "/facilities",
  "/administration",
  "/settings",
  // Help Center is clinical/operational guidance for facility staff, so it
  // belongs to the facility plane, not the operator's.
]

/** Routes the platform plane may open. Prefix match. */
export const PLATFORM_ALLOWED_ROUTES: string[] = [...PLATFORM_NAV_HREFS, "/platform"]

export function platformCanAccess(pathname: string): boolean {
  return PLATFORM_ALLOWED_ROUTES.some(
    (allowed) => pathname === allowed || pathname.startsWith(allowed + "/")
  )
}
