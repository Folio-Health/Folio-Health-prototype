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

import { isModuleInScope } from "@/config/phases"

export type RoleId =
  | "platform-admin"
  | "facility-admin"
  | "doctor"
  | "nurse"
  | "front-desk"
  | "him-officer"
  | "lab-scientist"
  | "radiographer"
  | "pharmacist"
  | "billing-cashier"

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
  "lab-scientist",
  "radiographer",
  "pharmacist",
  "billing-cashier",
]

/**
 * The installed AccessPolicy each facility role binds to.
 *
 * These names MUST stay byte-identical with the policies authored by the
 * platform's provisioning tooling (Folio-Web `packages/fhir-model/src/access.ts`).
 * This app looks policies up BY NAME and never rebuilds them — two definitions of
 * "what a nurse may read" drifting apart is a data breach, not a bug.
 *
 * `platform-admin` is absent deliberately: the platform plane comes from
 * `ProjectMembership.admin`, not from a facility-scoped policy, so there is no
 * policy to bind and no way to grant it by creating a staff account.
 */
export const ROLE_ACCESS_POLICY_NAMES: Record<Exclude<RoleId, "platform-admin">, string> = {
  "facility-admin": "Folio Facility Admin Access Policy",
  doctor: "Folio Doctor Access Policy",
  nurse: "Folio Nurse Access Policy",
  "front-desk": "Folio Front Desk Access Policy",
  "him-officer": "Folio HIM Access Policy",
  // BACKEND GAP — these four policies do NOT exist on the Medplum project yet.
  // Until Folio-Web's provisioning tooling (packages/fhir-model/src/access.ts)
  // authors them under these exact names, findAccessPolicyByName() will reject
  // an invite for these roles, so no account can actually be created with one.
  // The UI side (nav, dashboards, snapshot scoping, permission gating) is ready
  // ahead of that.
  //
  // `radiographer` is the newest of the four, added for the Implementation
  // Manuscript §3/§4.5 role that the 8-role EMR V1 spec had no equivalent for.
  // Its server policy must scope to the imaging snapshot (§4.5) — reason for
  // the study and presenting complaint — and must NOT grant the full chart.
  "lab-scientist": "Folio Lab Scientist Access Policy",
  radiographer: "Folio Radiographer Access Policy",
  pharmacist: "Folio Pharmacist Access Policy",
  "billing-cashier": "Folio Billing Access Policy",
}

/**
 * Roles a facility administrator may create within their own facility.
 *
 * Its own type, narrower than RoleId: `platform-admin` must be unrepresentable
 * here, not merely absent from the array. `facility-admin` is excluded too —
 * only the platform operator creates those, so a facility admin cannot mint
 * peers who could then provision further accounts.
 */
export type FacilityAssignableRole =
  | "doctor"
  | "nurse"
  | "front-desk"
  | "him-officer"
  | "lab-scientist"
  | "radiographer"
  | "pharmacist"
  | "billing-cashier"

export const FACILITY_ASSIGNABLE_ROLES: FacilityAssignableRole[] = [
  "doctor",
  "nurse",
  "front-desk",
  "him-officer",
  "lab-scientist",
  "radiographer",
  "pharmacist",
  "billing-cashier",
]

export function isFacilityAssignableRole(value: string): value is FacilityAssignableRole {
  return (FACILITY_ASSIGNABLE_ROLES as string[]).includes(value)
}

export function isRoleId(value: string): value is RoleId {
  return (KNOWN_ROLES as string[]).includes(value)
}

export const ROLE_LABELS: Record<RoleId, string> = {
  "platform-admin": "Super admin",
  "facility-admin": "Hospital admin",
  doctor: "Doctor",
  nurse: "Nurse",
  "front-desk": "Receptionist",
  "him-officer": "Medical Records Officer",
  "lab-scientist": "Laboratory Scientist",
  radiographer: "Radiographer",
  pharmacist: "Pharmacist",
  "billing-cashier": "Billing / Cashier",
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

/**
 * Nav hrefs each FACILITY role may see.
 *
 * Source of truth is the Implementation Manuscript §3 access table, read
 * together with the per-interface scoping in §4. The manuscript's governing
 * sentence, repeated by the mentor several times, is: **no two roles should
 * see the same data** — every role gets exactly the slice of the record
 * relevant to their job, never a shared undifferentiated chart.
 *
 * Same allow-list philosophy as PLATFORM_NAV_HREFS: a new module added to
 * nav.ts is hidden from every facility role by default. This is UI-layer
 * routing — it hides links a role shouldn't act on, it does not grant or deny
 * data access. The server-side AccessPolicy (see ROLE_ACCESS_POLICY_NAMES) is
 * the actual boundary; this must never be treated as a substitute for it.
 *
 * `facility-admin` is deliberately narrow, not "everything in the facility":
 * administrative authority must not imply routine clinical content access.
 */
export const ROLE_NAV_HREFS: Record<Exclude<RoleId, "platform-admin">, string[]> = {
  "facility-admin": [
    "/dashboard",
    "/administration",
    "/analytics",
    "/hr",
    "/inventory",
    "/communication",
    "/help",
    "/settings",
  ],
  // §3: "Full clinical documentation … owns the encounter note end-to-end."
  // §4.3 step 10 branches orders out to Lab, Radiology/Imaging and Pharmacy,
  // so the physician reaches all three — they are the one role that sees the
  // whole picture.
  doctor: [
    "/dashboard",
    "/assistant",
    "/patients",
    "/appointments",
    "/consultation",
    "/vitals",
    "/nursing",
    "/emergency",
    "/surgery",
    "/pediatrics",
    "/obstetrics",
    "/laboratory",
    "/radiology",
    "/blood-bank",
    "/pharmacy",
    "/admissions",
    "/communication",
    "/help",
    "/settings",
  ],
  // §3/§4.2: vitals + general (revocable) record access, and NOTHING else.
  //
  // Deliberately much narrower than it used to be. The manuscript's
  // country-specific scoping decision is explicit: in the UK/Ireland nurses
  // also clerk, but in Nigeria's current clinical landscape that sits with
  // the physician — "do not build clerking fields into the nurse role for
  // this market". So /consultation is gone.
  //
  // /laboratory is gone too: §8 lists "whether nurses should be able to
  // review lab results directly" as DEFERRED to a future mentor session —
  // mentioned as happening in some settings, not confirmed for this build.
  // Deferred means not granted; an allow-list fails closed.
  //
  // /admissions and /blood-bank likewise await §8's ADT and blood-bank
  // workflow sessions.
  nurse: [
    "/dashboard",
    "/assistant",
    "/patients",
    "/vitals",
    "/nursing",
    "/communication",
    "/help",
    "/settings",
  ],
  // §3/§4.1: registration and biodata only — "no access to clinical
  // documentation of any kind". Registration and identity search happen
  // inside /reception itself; no /patients, which would expose the chart.
  "front-desk": ["/dashboard", "/assistant", "/reception", "/appointments", "/communication", "/help", "/settings"],
  // Identity/demographics and document work needs the patient record, but
  // not its clinical sections — the patient workspace narrows what an HIM
  // officer sees once inside a chart.
  "him-officer": ["/dashboard", "/assistant", "/patients", "/communication", "/help", "/settings"],
  // §3/§4.4: snapshot only, worked from the order queue. Module-only — no
  // broad chart browsing. The snapshot itself is reached from the order (see
  // the clinical-snapshot feature), not by navigating a patient list.
  "lab-scientist": ["/dashboard", "/assistant", "/laboratory", "/blood-bank", "/communication", "/help", "/settings"],
  // §3/§4.5: "same snapshot model as lab" — a separate dashboard to upload
  // X-ray/scan results, which the physician then views. Parallel in every
  // respect to the lab scientist above.
  radiographer: ["/dashboard", "/assistant", "/radiology", "/communication", "/help", "/settings"],
  // §3/§4.6: medication orders plus a snapshot of medication history,
  // presenting complaint and allergies. Does NOT see the physician's full
  // clinical notes. /inventory is pharmacy stock, not the clinical chart.
  pharmacist: ["/dashboard", "/assistant", "/pharmacy", "/inventory", "/communication", "/help", "/settings"],
  // No /patients: billing must not open the complete chart. Diagnosis coding
  // needed for a claim is a field inside /billing itself.
  "billing-cashier": ["/dashboard", "/assistant", "/billing", "/communication", "/help", "/settings"],
}

/**
 * Whether a facility-plane user may open `pathname` — the render-blocking
 * counterpart to ROLE_NAV_HREFS, in the same spirit as PLATFORM_ALLOWED_ROUTES
 * / platformCanAccess. Hiding a nav link is not access control on its own; a
 * URL typed directly into the address bar still has to be blocked.
 *
 * `/patients/<id>` (one specific chart) is deliberately exempted from the
 * general prefix check: roles without general patient-browsing rights
 * (billing, reception, HIM, facility-admin) can still be linked to one
 * specific patient from their own module (an invoice, an appointment, a
 * registration) and see the restricted view getVisiblePatientTabs()
 * already builds for them. `/patients` itself (the full roster) still
 * requires the role to hold it in ROLE_NAV_HREFS — browsing every patient
 * in the facility is a different, broader capability than opening one.
 */
export function facilityRouteAllowed(pathname: string, roles: RoleId[]): boolean {
  // Modules deferred to Phase 2 (manuscript §7) are closed to every role,
  // regardless of what their allow-list says — scope is a build decision, not
  // a permission one. See src/config/phases.ts.
  if (!isModuleInScope(pathname)) return false

  if (pathname.startsWith("/patients/")) return true

  const facilityRoles = roles.filter((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")
  // No recognized role tag yet: same permissive fallback as useScopedNav().
  if (facilityRoles.length === 0) return true

  return facilityRoles.some((role) =>
    ROLE_NAV_HREFS[role]?.some((href) => pathname === href || pathname.startsWith(href + "/"))
  )
}
