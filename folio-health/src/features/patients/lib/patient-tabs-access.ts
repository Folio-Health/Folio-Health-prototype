import type { RoleId } from "@/lib/auth/roles"

export type PatientTabKey =
  | "overview"
  | "history"
  | "appointments"
  | "lab"
  | "imaging"
  | "pharmacy"
  | "billing"

/**
 * Which patient-workspace tabs each role may see (EMR V1 RBAC spec §19).
 *
 * UI-layer data minimization only — hides a section a role has no
 * professional reason to open. It is not the security boundary: the real
 * one is the server-side Medplum AccessPolicy, which decides what data the
 * underlying FHIR queries actually return regardless of what this hides.
 *
 * `lab-scientist` gets nothing here on purpose — the spec is explicit that
 * lab personnel work from order/specimen queues, not by browsing a chart
 * (§7.3, §16 "Do not provide broad clinical navigation").
 */
const ROLE_PATIENT_TABS: Record<Exclude<RoleId, "platform-admin">, PatientTabKey[]> = {
  doctor: ["overview", "history", "appointments", "lab", "imaging", "pharmacy"],
  nurse: ["overview", "history", "appointments", "lab", "imaging", "pharmacy"],
  "front-desk": ["appointments"],
  "him-officer": ["appointments"],
  "lab-scientist": [],
  // Allergies (overview) and the prescription-queue link are what medication
  // safety actually requires (§7.4); the rest of the chart is out of scope.
  pharmacist: ["overview", "pharmacy"],
  "billing-cashier": ["billing"],
  "facility-admin": ["appointments", "billing"],
}

export function getVisiblePatientTabs(roles: RoleId[]): PatientTabKey[] {
  const facilityRoles = roles.filter((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")

  // No recognized role tag yet: same permissive-fallback stance as
  // useScopedNav — a provisioning gap should not silently lock someone out.
  if (facilityRoles.length === 0) {
    return ["overview", "history", "appointments", "lab", "imaging", "pharmacy", "billing"]
  }

  const allowed = new Set<PatientTabKey>()
  for (const role of facilityRoles) {
    for (const tab of ROLE_PATIENT_TABS[role] ?? []) allowed.add(tab)
  }
  return Array.from(allowed)
}

/**
 * Who may edit patient demographics.
 *
 * Reception owns unsaved corrections and Medical Records owns approved
 * post-registration corrections (§7.5, §7.6); clinicians and diagnostic/
 * financial roles have no reason to rewrite identity data.
 */
const DEMOGRAPHICS_EDITORS: Exclude<RoleId, "platform-admin">[] = [
  "front-desk",
  "him-officer",
  "facility-admin",
]

export function canEditDemographics(roles: RoleId[]): boolean {
  const facilityRoles = roles.filter((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")
  if (facilityRoles.length === 0) return true
  return facilityRoles.some((role) => DEMOGRAPHICS_EDITORS.includes(role))
}

export type IdentityField = "ageGender" | "dob" | "phone" | "email" | "address"

/**
 * Which identity-card fields each role sees (spec §31: restrict fields, not
 * just pages). The name/MRN/status header always shows regardless — every
 * role that reaches a patient at all needs to know who they're looking at —
 * but contact details are a different sensitivity than clinical or financial
 * access and shouldn't ride along with it by default.
 */
const ROLE_IDENTITY_FIELDS: Record<Exclude<RoleId, "platform-admin">, IdentityField[]> = {
  doctor: ["ageGender", "dob", "phone", "email", "address"],
  nurse: ["ageGender", "dob", "phone", "email", "address"],
  // Registration/scheduling is literally built on this contact information.
  "front-desk": ["ageGender", "dob", "phone", "email", "address"],
  "him-officer": ["ageGender", "dob", "phone", "email", "address"],
  // Age/DOB matter for lab and medication safety; home contact details don't.
  "lab-scientist": ["ageGender", "dob"],
  pharmacist: ["ageGender", "dob"],
  // Billing needs who the patient is, not how to reach them at home — that's
  // reception's job. Facility-admin oversight doesn't need it either.
  "billing-cashier": [],
  "facility-admin": [],
}

export function getVisibleIdentityFields(roles: RoleId[]): Set<IdentityField> {
  const facilityRoles = roles.filter((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")
  if (facilityRoles.length === 0) {
    return new Set(["ageGender", "dob", "phone", "email", "address"])
  }
  const allowed = new Set<IdentityField>()
  for (const role of facilityRoles) {
    for (const field of ROLE_IDENTITY_FIELDS[role] ?? []) allowed.add(field)
  }
  return allowed
}
