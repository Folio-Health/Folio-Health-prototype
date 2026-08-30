import type {
  Encounter,
  Location,
  Organization,
  Practitioner,
  PractitionerRole,
  Reference,
} from "@medplum/fhirtypes"
import type { Admission, AdmissionStatus, Bed, BedStatus, Ward } from "@/lib/mock/admissions"

/**
 * Admissions to FHIR.
 *
 *   Ward      -> Location (physical type "wa")
 *   Bed       -> Location (physical type "bd"), partOf its ward
 *   Admission -> Encounter (class IMP, inpatient), location[] pointing at the bed
 *
 * WHY LOCATIONS AND NOT A BESPOKE RESOURCE. FHIR already models a hospital's
 * physical hierarchy as nested Locations, and Encounter.location references
 * them directly. Inventing a Folio-specific ward/bed resource would mean the
 * bed a patient occupies could not be expressed in the Encounter at all, which
 * is the one place any other system would look for it.
 *
 * BED STATUS IS DERIVED, NOT STORED. `Location.status` says whether a bed
 * EXISTS and is usable (active / suspended / inactive); it does not say whether
 * someone is lying in it. Occupancy comes from whether an in-progress Encounter
 * references the bed. Storing occupancy on the Location as well would create
 * two answers to "is this bed free", and they would drift the first time an
 * admission failed halfway through.
 */

const LOCATION_PHYSICAL_TYPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/location-physical-type"

const WARD_TYPE = { system: LOCATION_PHYSICAL_TYPE_SYSTEM, code: "wa", display: "Ward" }
const BED_TYPE = { system: LOCATION_PHYSICAL_TYPE_SYSTEM, code: "bd", display: "Bed" }

/** Ward capacity has no FHIR field, so it is carried as an extension. */
export const WARD_CAPACITY_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/ward-capacity"

/** Marks a bed unavailable for reasons other than occupancy (cleaning, reserved). */
export const BED_STATE_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/bed-state"

export function isWard(location: Location): boolean {
  return location.physicalType?.coding?.some((c) => c.code === "wa") ?? false
}

export function isBed(location: Location): boolean {
  return location.physicalType?.coding?.some((c) => c.code === "bd") ?? false
}

// -- Reading ----------------------------------------------------------------

export function toWard(location: Location): Ward {
  const capacity = location.extension?.find((e) => e.url === WARD_CAPACITY_EXTENSION_URL)
    ?.valueInteger
  return {
    id: location.id ?? "",
    name: location.name ?? "Unnamed ward",
    department: location.type?.[0]?.text ?? location.type?.[0]?.coding?.[0]?.display ?? "General",
    // 0 means "not recorded", not "no beds" — the ward screen shows the real
    // bed count alongside it rather than treating this as authoritative.
    capacity: capacity ?? 0,
    headNurseId: location.managingOrganization?.reference?.split("/")[1] ?? "",
  }
}

/**
 * @param occupiedBedIds beds with an in-progress Encounter against them.
 */
export function toBed(location: Location, occupiedBedIds: Set<string>): Bed {
  const id = location.id ?? ""
  const declaredState = location.extension?.find((e) => e.url === BED_STATE_EXTENSION_URL)
    ?.valueString as BedStatus | undefined

  let status: BedStatus
  if (occupiedBedIds.has(id)) {
    // Occupancy always wins: a bed with a patient in it is occupied regardless
    // of what anyone marked it as.
    status = "Occupied"
  } else if (declaredState === "Cleaning" || declaredState === "Reserved") {
    status = declaredState
  } else {
    status = "Available"
  }

  return {
    id,
    wardId: location.partOf?.reference?.split("/")[1] ?? "",
    label: location.name ?? "Bed",
    status,
  }
}

export function toAdmissionStatus(encounter: Encounter): AdmissionStatus {
  return encounter.status === "finished" ? "Discharged" : "Admitted"
}

export function toAdmission(encounter: Encounter): Admission {
  const bedRef = encounter.location?.find((l) => l.location?.reference?.startsWith("Location/"))
  const doctor = encounter.participant?.find((p) =>
    p.individual?.reference?.startsWith("Practitioner/")
  )

  return {
    id: encounter.id ?? "",
    patientId: encounter.subject?.reference?.split("/")[1] ?? "",
    // The ward is resolved by the caller from the bed's partOf; an Encounter
    // records the bed, and deriving the ward here would need another fetch.
    wardId: "",
    bedId: bedRef?.location?.reference?.split("/")[1] ?? "",
    doctorId: doctor?.individual?.reference?.split("/")[1] ?? "",
    admissionDate: encounter.period?.start ?? encounter.meta?.lastUpdated ?? "",
    diagnosis: encounter.reasonCode?.[0]?.text ?? "",
    status: toAdmissionStatus(encounter),
    dischargeDate: encounter.period?.end,
    // FHIR has no "ready for discharge" flag. It is a workflow state this app
    // does not yet persist, so it is reported as unknown rather than guessed.
    readyForDischarge: undefined,
    dischargeSummaryReady: undefined,
  }
}

/** Bed ids occupied by an in-progress Encounter. */
export function occupiedBedIds(encounters: Encounter[]): Set<string> {
  const ids = new Set<string>()
  for (const encounter of encounters) {
    if (encounter.status === "finished" || encounter.status === "cancelled") continue
    for (const entry of encounter.location ?? []) {
      // `active` is the FHIR status for "currently here"; a completed stint in
      // a bed must not keep it marked occupied.
      if (entry.status && entry.status !== "active") continue
      const id = entry.location?.reference?.split("/")[1]
      if (id) ids.add(id)
    }
  }
  return ids
}

// -- Writing ----------------------------------------------------------------

export function buildWard(input: {
  name: string
  department: string
  capacity?: number
  facility?: Reference<Organization>
}): Location {
  return {
    resourceType: "Location",
    status: "active",
    name: input.name,
    mode: "instance",
    physicalType: { coding: [WARD_TYPE] },
    type: [{ text: input.department }],
    ...(input.facility ? { managingOrganization: input.facility } : {}),
    ...(input.capacity
      ? { extension: [{ url: WARD_CAPACITY_EXTENSION_URL, valueInteger: input.capacity }] }
      : {}),
  }
}

export function buildBed(input: {
  label: string
  wardId: string
  facility?: Reference<Organization>
}): Location {
  return {
    resourceType: "Location",
    status: "active",
    name: input.label,
    mode: "instance",
    physicalType: { coding: [BED_TYPE] },
    partOf: { reference: `Location/${input.wardId}` },
    ...(input.facility ? { managingOrganization: input.facility } : {}),
  }
}

export interface BuildAdmissionInput {
  patientId: string
  bedId: string
  diagnosis: string
  doctor?: Reference<Practitioner | PractitionerRole>
  facility?: Reference<Organization>
}

export function buildAdmission(input: BuildAdmissionInput): Encounter {
  return {
    resourceType: "Encounter",
    status: "in-progress",
    // IMP is the HL7 code for an inpatient admission, which is what makes this
    // an admission rather than an outpatient visit.
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "IMP",
      display: "inpatient encounter",
    },
    subject: { reference: `Patient/${input.patientId}` },
    period: { start: new Date().toISOString() },
    location: [{ location: { reference: `Location/${input.bedId}` }, status: "active" }],
    ...(input.diagnosis ? { reasonCode: [{ text: input.diagnosis }] } : {}),
    ...(input.doctor
      ? {
          participant: [
            {
              individual: input.doctor,
              type: [
                {
                  coding: [
                    {
                      system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                      code: "ATND",
                      display: "attender",
                    },
                  ],
                },
              ],
            },
          ],
        }
      : {}),
    ...(input.facility ? { serviceProvider: input.facility } : {}),
  }
}

/**
 * Close an admission.
 *
 * Ends the bed occupancy as well as the encounter: leaving `location[].status`
 * at "active" would keep the bed showing as occupied after the patient left,
 * and the ward would slowly fill up with phantom patients.
 */
export function dischargeEncounter(encounter: Encounter): Encounter {
  const now = new Date().toISOString()
  return {
    ...encounter,
    status: "finished",
    period: { ...encounter.period, start: encounter.period?.start ?? now, end: now },
    location: (encounter.location ?? []).map((entry) => ({
      ...entry,
      status: "completed",
      period: { ...entry.period, end: now },
    })),
  }
}
