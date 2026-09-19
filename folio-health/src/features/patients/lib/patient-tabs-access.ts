import type { RoleId } from "@/lib/auth/roles"

export type PatientTabKey =
  | "overview"
  | "history"
  | "appointments"
  | "snapshot"
  | "lab"
  | "imaging"
  | "pharmacy"
  | "billing"

/**
 * Which patient-workspace sections each role may see (Implementation
 * Manuscript §3).
 *
 * The manuscript's design implication is the point of this file: *this is not
 * a single "patient record view" with field-level permission toggles bolted on
 * as an afterthought — each role effectively needs its own composed view,
 * generated from the underlying encounter data.* So the diagnostic and
 * dispensing roles do not get a trimmed chart; they get `snapshot`, a
 * different artifact composed for them (see getSnapshotSections below and the
 * clinical-snapshot feature).
 *
 * UI-layer data minimization only — it is not the security boundary. The real
 * one is the server-side Medplum AccessPolicy, which decides what data the
 * underlying FHIR queries actually return regardless of what this hides.
 */
const ROLE_PATIENT_TABS: Record<Exclude<RoleId, "platform-admin">, PatientTabKey[]> = {
  // §3: full clinical documentation; owns the encounter note end-to-end.
  doctor: ["overview", "history", "appointments", "lab", "imaging", "pharmacy"],
  // §3/§4.2: vitals plus general patient record/history. No lab tab — §8
  // defers "whether nurses should be able to review lab results directly"
  // to a future mentor session, and an allow-list fails closed on a question
  // nobody has answered yet.
  nurse: ["overview", "history", "appointments"],
  // §3: registration/biodata only. "No access to clinical documentation of
  // any kind" — the identity card beside these tabs is the receptionist's
  // whole view of the chart.
  "front-desk": ["appointments"],
  "him-officer": ["appointments"],
  // §3/§4.4 and §4.5: snapshot only — reason for test / relevant presenting
  // complaint. Explicitly "not the full record".
  "lab-scientist": ["snapshot"],
  radiographer: ["snapshot"],
  // §3/§4.6: snapshot only — medication history, presenting complaint and
  // allergies. Does NOT see the physician's full clinical notes, so no
  // `overview`/`history`; the allergies the pharmacist must always see are
  // part of the snapshot itself, not a chart tab.
  pharmacist: ["snapshot", "pharmacy"],
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
 * The parts of the encounter snapshot a role receives (§4.4, §4.5, §4.6).
 *
 * The snapshot is one mechanism with two shapes, and the manuscript is precise
 * about the difference:
 *
 *   - lab / radiology — "reason for test / relevant presenting complaint"
 *   - pharmacy        — "medication history, presenting complaint, allergies"
 *
 * `allergies` is called out in §4.6 as always-visible and non-negotiable, so
 * it is a section in its own right rather than a field that could be dropped
 * by a later edit without anyone noticing.
 */
export type SnapshotSection = "reason" | "complaint" | "allergies" | "medications"

const ROLE_SNAPSHOT_SECTIONS: Partial<
  Record<Exclude<RoleId, "platform-admin">, SnapshotSection[]>
> = {
  "lab-scientist": ["reason", "complaint"],
  radiographer: ["reason", "complaint"],
  pharmacist: ["complaint", "allergies", "medications"],
  // The physician authored the note the snapshot is derived from, so they see
  // every section — useful for checking what a downstream role was actually
  // told before answering a query about it (§4.4).
  doctor: ["reason", "complaint", "allergies", "medications"],
}

export function getSnapshotSections(roles: RoleId[]): SnapshotSection[] {
  const facilityRoles = roles.filter((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")
  if (facilityRoles.length === 0) return ["reason", "complaint", "allergies", "medications"]

  const allowed = new Set<SnapshotSection>()
  for (const role of facilityRoles) {
    for (const section of ROLE_SNAPSHOT_SECTIONS[role] ?? []) allowed.add(section)
  }
  return Array.from(allowed)
}

/**
 * Who may edit patient demographics.
 *
 * Reception REGISTERS patients but may not rewrite a record once it exists —
 * post-registration corrections are Medical Records' job (§7.5, §7.6), with
 * the facility administrator as oversight. This is enforced server-side too:
 * the Front Desk AccessPolicy marks Patient readonly (registration itself
 * goes through /api/patients with the service identity), so hiding the Edit
 * button here is presentation, not the boundary.
 */
const DEMOGRAPHICS_EDITORS: Exclude<RoleId, "platform-admin">[] = [
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
 * Which identity-card fields each role sees — restrict fields, not just pages.
 * The name/MRN/status header always shows regardless: every role that reaches
 * a patient at all needs to know who they're looking at. Contact details are a
 * different sensitivity and shouldn't ride along by default.
 */
const ROLE_IDENTITY_FIELDS: Record<Exclude<RoleId, "platform-admin">, IdentityField[]> = {
  doctor: ["ageGender", "dob", "phone", "email", "address"],
  nurse: ["ageGender", "dob", "phone", "email", "address"],
  // Registration and scheduling are literally built on this information (§4.1).
  "front-desk": ["ageGender", "dob", "phone", "email", "address"],
  "him-officer": ["ageGender", "dob", "phone", "email", "address"],
  // Age/sex matter for reference ranges, radiation dose and medication
  // safety; home contact details don't.
  "lab-scientist": ["ageGender", "dob"],
  radiographer: ["ageGender", "dob"],
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
