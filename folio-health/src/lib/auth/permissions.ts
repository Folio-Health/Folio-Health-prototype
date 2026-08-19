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
  doctor: ["VIEW", "CREATE", "AMEND", "SIGN", "PRESCRIBE", "ORDER", "PRINT"],
  nurse: ["VIEW", "CREATE", "ADMINISTER"],
  // PRINT here too: lab reports and specimen labels are a normal part of
  // processing an order, not something reserved for a doctor's own notes.
  "lab-scientist": [
    "VIEW",
    "PRINT",
    "LAB_ACCEPT_SPECIMEN",
    "LAB_ENTER_RESULT",
    "LAB_VERIFY_RESULT",
    "LAB_RELEASE_RESULT",
  ],
  // PRINT here too: a dispensing label or counselling sheet is routine, not
  // an escalation.
  pharmacist: ["VIEW", "PRINT", "PHARMACY_DISPENSE", "PHARMACY_RECONCILE", "PHARMACY_DOCUMENT_INTERVENTION"],
  // Initiate-only (spec §7.5): create registration/appointment/encounter
  // records, nothing clinical.
  "front-desk": ["CREATE"],
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
