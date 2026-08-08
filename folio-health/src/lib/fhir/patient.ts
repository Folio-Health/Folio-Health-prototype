import type { Patient as FhirPatient, HumanName } from "@medplum/fhirtypes"
import type { Gender, PatientStatus } from "@/types/core"

/**
 * Projection of a FHIR `Patient` into what the patient screens actually render.
 *
 * Only fields FHIR genuinely carries on `Patient` live here. Things the mock
 * data used to invent on the same object — blood group, allergies, chronic
 * conditions, insurance, assigned doctor, last visit — are separate FHIR
 * resources (Observation, AllergyIntolerance, Condition, Coverage,
 * CareTeam/Encounter) and are fetched by the screens that need them, rather
 * than being pretended to exist here.
 */
export interface PatientSummary {
  id: string
  mrn: string
  name: string
  firstName: string
  lastName: string
  gender: Gender
  dob?: string
  /** Undefined when the record has no birth date — never guessed. */
  age?: number
  phone: string
  email: string
  address: string
  status: PatientStatus
  managingOrganization?: string
}

/** Identifier types that denote a medical record number, most preferred first. */
const MRN_CODES = ["MR", "MRN"]

export function formatHumanName(name: HumanName | undefined): {
  full: string
  first: string
  last: string
} {
  if (!name) return { full: "Unnamed patient", first: "", last: "" }
  if (name.text) {
    const parts = name.text.trim().split(/\s+/)
    return {
      full: name.text,
      first: parts[0] ?? "",
      last: parts.length > 1 ? parts[parts.length - 1] : "",
    }
  }
  const first = (name.given ?? []).join(" ")
  const last = name.family ?? ""
  const full = [first, last].filter(Boolean).join(" ")
  return { full: full || "Unnamed patient", first, last }
}

export function patientMrn(patient: FhirPatient): string {
  const identifiers = patient.identifier ?? []
  const byType = identifiers.find((i) =>
    i.type?.coding?.some((c) => c.code && MRN_CODES.includes(c.code))
  )
  const chosen = byType ?? identifiers[0]
  return chosen?.value ?? patient.id ?? "—"
}

/**
 * Whole years elapsed, month- and day-aware.
 *
 * The mock data computed age as a bare year subtraction, which overstated by up
 * to a year for anyone whose birthday had not yet occurred — and that value fed
 * the paediatric (`age < 18`) and obstetric eligibility filters.
 */
export function ageFromBirthDate(birthDate: string | undefined, now = new Date()): number | undefined {
  if (!birthDate) return undefined
  const dob = new Date(birthDate)
  if (Number.isNaN(dob.getTime())) return undefined
  let age = now.getFullYear() - dob.getFullYear()
  const monthDelta = now.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1
  return age >= 0 ? age : undefined
}

function toGender(gender: FhirPatient["gender"]): Gender {
  switch (gender) {
    case "male":
      return "Male"
    case "female":
      return "Female"
    default:
      return "Other"
  }
}

function toStatus(patient: FhirPatient): PatientStatus {
  if (patient.deceasedBoolean || patient.deceasedDateTime) return "Deceased"
  return patient.active === false ? "Inactive" : "Active"
}

function firstTelecom(patient: FhirPatient, system: "phone" | "email"): string {
  return patient.telecom?.find((t) => t.system === system)?.value ?? ""
}

function formatAddress(patient: FhirPatient): string {
  const address = patient.address?.[0]
  if (!address) return ""
  if (address.text) return address.text
  return [address.line?.join(" "), address.city, address.state, address.country]
    .filter(Boolean)
    .join(", ")
}

export function toPatientSummary(patient: FhirPatient): PatientSummary {
  const { full, first, last } = formatHumanName(patient.name?.[0])
  return {
    id: patient.id ?? "",
    mrn: patientMrn(patient),
    name: full,
    firstName: first,
    lastName: last,
    gender: toGender(patient.gender),
    dob: patient.birthDate,
    age: ageFromBirthDate(patient.birthDate),
    phone: firstTelecom(patient, "phone"),
    email: firstTelecom(patient, "email"),
    address: formatAddress(patient),
    status: toStatus(patient),
    managingOrganization: patient.managingOrganization?.display,
  }
}
