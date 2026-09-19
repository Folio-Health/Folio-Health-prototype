import type { RoleId } from "./roles"

/**
 * Action-level permissions (EMR V1 RBAC spec §13).
 *
 * Deliberately granular — no CAN_ACCESS_PATIENT-style catch-all. Every UI
 * affordance (a Sign button, a Dispense action, an Export link) should check
 * a specific permission here, not a role name directly, so the check reads
 * the same regardless of which roles happen to hold it today.
 */
export type Permission =
  | "VIEW"
  | "CREATE"
  | "AMEND"
  | "SIGN"
  | "PRESCRIBE"
  | "ORDER"
  | "VERIFY"
  | "DISPENSE"
  | "ADMINISTER"
  | "PRINT"
  | "EXPORT"
  | "DISCLOSE"
  | "MANAGE_USERS"
  | "MANAGE_ROLES"
  | "MANAGE_CONFIGURATION"
  | "LAB_ACCEPT_SPECIMEN"
  | "LAB_ENTER_RESULT"
  | "LAB_VERIFY_RESULT"
  | "LAB_RELEASE_RESULT"
  | "IMAGING_ACQUIRE_STUDY"
  | "IMAGING_UPLOAD_FINDING"
  | "ORDER_QUERY"
  | "ORDER_ANSWER_QUERY"
  | "PHARMACY_DISPENSE"
  | "PHARMACY_RECONCILE"
  | "PHARMACY_DOCUMENT_INTERVENTION"
  | "BILLING_POST_CHARGE"
  | "BILLING_RECEIVE_PAYMENT"
  | "BILLING_REFUND"
  | "BILLING_CLAIM"

/** Every permission, in spec order — for rendering a full matrix. */
export const ALL_PERMISSIONS: Permission[] = [
  "VIEW",
  "CREATE",
  "AMEND",
  "SIGN",
  "PRESCRIBE",
  "ORDER",
  "VERIFY",
  "DISPENSE",
  "ADMINISTER",
  "PRINT",
  "EXPORT",
  "DISCLOSE",
  "MANAGE_USERS",
  "MANAGE_ROLES",
  "MANAGE_CONFIGURATION",
  "LAB_ACCEPT_SPECIMEN",
  "LAB_ENTER_RESULT",
  "LAB_VERIFY_RESULT",
  "LAB_RELEASE_RESULT",
  "IMAGING_ACQUIRE_STUDY",
  "IMAGING_UPLOAD_FINDING",
  "ORDER_QUERY",
  "ORDER_ANSWER_QUERY",
  "PHARMACY_DISPENSE",
  "PHARMACY_RECONCILE",
  "PHARMACY_DOCUMENT_INTERVENTION",
  "BILLING_POST_CHARGE",
  "BILLING_RECEIVE_PAYMENT",
  "BILLING_REFUND",
  "BILLING_CLAIM",
]

/**
 * What each facility role may do (spec §7, §13). Platform admin is handled
 * separately in `can()` — it is technical administration, not a chart role,
 * so it has no entry here (spec §12, §30: admin authority must not imply
 * clinical/financial action rights).
 */
export const ROLE_PERMISSIONS: Record<Exclude<RoleId, "platform-admin">, Permission[]> = {
  // §9.1 "orders are the spine": the physician is the only role that signs an
  // order into existence. ORDER_ANSWER_QUERY closes the loop a diagnostic role
  // opens against one (§4.4, §9.4).
  doctor: ["VIEW", "CREATE", "AMEND", "SIGN", "PRESCRIBE", "ORDER", "PRINT", "ORDER_ANSWER_QUERY"],
  // §4.2: vitals and general record access. No SIGN, no ORDER, no clerking —
  // that responsibility sits with the physician in this market.
  nurse: ["VIEW", "CREATE", "ADMINISTER"],
  // PRINT here too: lab reports and specimen labels are a normal part of
  // processing an order, not something reserved for a doctor's own notes.
  // ORDER_QUERY is the manuscript's "two-way channel, not a one-way results
  // pipe" (§4.4): the lab scientist can flag or query an order back to the
  // physician — "why is this test being ordered given X" — as an explicit,
  // tracked loop rather than a side conversation (§9.4).
  "lab-scientist": [
    "VIEW",
    "PRINT",
    "LAB_ACCEPT_SPECIMEN",
    "LAB_ENTER_RESULT",
    "LAB_VERIFY_RESULT",
    "LAB_RELEASE_RESULT",
    "ORDER_QUERY",
  ],
  // §4.5: "parallel structure to lab". Acquires the study, uploads the
  // finding for the physician to view, and holds the same query-back channel.
  // Notably NO order rights — the radiographer executes orders, never signs
  // them (§9.5: orderer ≠ resulter).
  radiographer: [
    "VIEW",
    "PRINT",
    "IMAGING_ACQUIRE_STUDY",
    "IMAGING_UPLOAD_FINDING",
    "ORDER_QUERY",
  ],
  // PRINT here too: a dispensing label or counselling sheet is routine, not
  // an escalation.
  pharmacist: [
    "VIEW",
    "PRINT",
    "PHARMACY_DISPENSE",
    "PHARMACY_RECONCILE",
    "PHARMACY_DOCUMENT_INTERVENTION",
    "ORDER_QUERY",
  ],
  // §3/§4.1: "registration/biodata only … no access to clinical documentation
  // of any kind". VIEW is what lets reception read back the biodata and queue
  // they themselves created — what they can view is narrowed by
  // getVisiblePatientTabs (appointments only) and by ROLE_NAV_HREFS, not by
  // withholding VIEW, which only had the effect of hiding reception's own
  // work from them.
  "front-desk": ["VIEW", "CREATE"],
  "him-officer": ["VIEW", "AMEND", "EXPORT", "DISCLOSE"],
  "billing-cashier": ["VIEW", "BILLING_POST_CHARGE", "BILLING_RECEIVE_PAYMENT", "BILLING_REFUND", "BILLING_CLAIM"],
  // VIEW here too: facility-admin does see appointment/billing context for
  // patients (getVisiblePatientTabs), so the permission list should say so
  // rather than implying they see nothing at all.
  "facility-admin": ["VIEW", "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_CONFIGURATION"],
}

/** What the platform plane may do — technical administration only. */
const PLATFORM_PERMISSIONS: Permission[] = ["MANAGE_USERS", "MANAGE_ROLES", "MANAGE_CONFIGURATION"]

/** "LAB_RELEASE_RESULT" -> "Lab Release Result", for display in admin UI. */
export function formatPermissionLabel(permission: Permission): string {
  return permission
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Whether the given roles include `permission`.
 *
 * This is a UI-layer convenience for showing/hiding/disabling an action — it
 * decides what the interface offers, not what the server will actually do.
 * The server-side Medplum AccessPolicy is the real boundary; a hidden button
 * here does not make the underlying FHIR operation any less protected, and a
 * bug here does not make it any less protected either.
 *
 * An empty/unrecognized role set is treated permissively (matches
 * reconcileRoles()/useScopedNav()'s "provisioning gap, not a decision"
 * stance) rather than silently hiding every action for an unprovisioned user.
 */
export function can(roles: RoleId[], permission: Permission): boolean {
  if (roles.includes("platform-admin")) return PLATFORM_PERMISSIONS.includes(permission)

  const facilityRoles = roles.filter((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")
  if (facilityRoles.length === 0) return true

  return facilityRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission))
}
