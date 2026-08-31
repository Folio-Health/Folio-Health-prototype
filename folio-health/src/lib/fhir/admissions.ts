import type {
  Encounter,
  Location,
  Organization,
  Practitioner,
  PractitionerRole,
  Reference,
  ServiceRequest,
} from "@medplum/fhirtypes"
import type {
  Admission,
  AdmissionStatus,
  Bed,
  BedStatus,
  ICUStatus,
  Transfer,
  TransferStatus,
  Ward,
} from "@/lib/mock/admissions"

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

/**
 * "Ready for discharge" — a workflow state FHIR does not model.
 *
 * An Encounter is either in-progress or finished; there is no standard way to
 * say "medically done, waiting on paperwork or transport", which is exactly the
 * state a discharge queue exists to track. Carried as a Folio extension rather
 * than faked by finishing the encounter early, which would free the bed while
 * the patient is still in it.
 */
export const READY_FOR_DISCHARGE_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/ready-for-discharge"

/**
 * ICU acuity — Critical / Stable / Improving.
 *
 * Not a FHIR concept. The nearest standard equivalent would be a scored
 * assessment (APACHE, SOFA) recorded as an Observation, which is a different
 * and much heavier thing than the three-level flag this board shows. Carried
 * as an extension on the Encounter, set by whoever is watching the patient.
 */
export const ICU_ACUITY_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/icu-acuity"

/** Whether the patient is ventilated. Same reasoning as acuity. */
export const ON_VENTILATOR_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/on-ventilator"

/**
 * Transfer approval state.
 *
 * FHIR records where a patient IS (Encounter.location) but has no resource for
 * "a transfer that has been requested and is awaiting approval". The move
 * itself is a real location change; the approval workflow around it is Folio's,
 * so it is carried on a ServiceRequest that references the encounter.
 */
export const TRANSFER_CATEGORY = {
  system: "https://folio.health/fhir/sid/request-category",
  code: "ward-transfer",
  display: "Ward transfer",
}

export const TRANSFER_TO_BED_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/transfer-to-bed"

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
    readyForDischarge: encounter.extension?.some(
      (e) => e.url === READY_FOR_DISCHARGE_EXTENSION_URL && e.valueBoolean === true
    ),
    // Still unmodelled: whether the discharge SUMMARY document is written. That
    // is a DocumentReference question, not a flag, and is reported as unknown
    // rather than conflated with medical readiness.
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

/** The ICU acuity recorded against an encounter, when one has been set. */
export function icuAcuityOf(encounter: Encounter): ICUStatus | undefined {
  const value = encounter.extension?.find((e) => e.url === ICU_ACUITY_EXTENSION_URL)?.valueString
  return value === "Critical" || value === "Stable" || value === "Improving" ? value : undefined
}

export function onVentilator(encounter: Encounter): boolean {
  return (
    encounter.extension?.some(
      (e) => e.url === ON_VENTILATOR_EXTENSION_URL && e.valueBoolean === true
    ) ?? false
  )
}

/** Set acuity and ventilation, preserving extensions this app does not own. */
export function withIcuState(
  encounter: Encounter,
  state: { acuity?: ICUStatus; onVentilator?: boolean }
): Encounter {
  const kept = (encounter.extension ?? []).filter(
    (e) => e.url !== ICU_ACUITY_EXTENSION_URL && e.url !== ON_VENTILATOR_EXTENSION_URL
  )
  const extension = [
    ...kept,
    ...(state.acuity ? [{ url: ICU_ACUITY_EXTENSION_URL, valueString: state.acuity }] : []),
    ...(state.onVentilator !== undefined
      ? [{ url: ON_VENTILATOR_EXTENSION_URL, valueBoolean: state.onVentilator }]
      : []),
  ]
  return { ...encounter, extension: extension.length ? extension : undefined }
}

/**
 * Move a patient to a different bed.
 *
 * Closes the current location entry and opens a new one rather than editing the
 * existing entry, so the encounter keeps a truthful history of where the
 * patient has been. Overwriting would erase the fact that they were ever in the
 * previous bed — which is exactly what an infection trace needs.
 */
export function withBedMove(encounter: Encounter, toBedId: string): Encounter {
  const now = new Date().toISOString()
  const closed = (encounter.location ?? []).map((entry) =>
    entry.status === "active" || !entry.status
      ? { ...entry, status: "completed" as const, period: { ...entry.period, end: now } }
      : entry
  )
  return {
    ...encounter,
    location: [
      ...closed,
      {
        location: { reference: `Location/${toBedId}` },
        status: "active" as const,
        period: { start: now },
      },
    ],
  }
}

/** Flag or unflag an encounter as medically ready for discharge. */
export function withReadyForDischarge(encounter: Encounter, ready: boolean): Encounter {
  const kept = (encounter.extension ?? []).filter(
    (e) => e.url !== READY_FOR_DISCHARGE_EXTENSION_URL
  )
  const extension = ready
    ? [...kept, { url: READY_FOR_DISCHARGE_EXTENSION_URL, valueBoolean: true }]
    : kept
  // Omit the array entirely when empty: an empty extension[] is invalid FHIR.
  return { ...encounter, extension: extension.length ? extension : undefined }
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

// -- Transfers ---------------------------------------------------------------

/**
 * A ward transfer request.
 *
 * The MOVE is a location change on the Encounter. The REQUEST — who asked, why,
 * and whether it has been approved — is a ServiceRequest pointing at that
 * encounter, because FHIR has nowhere else to put an approval workflow.
 *
 * Keeping them separate matters: a pending request must not move the patient,
 * and a completed move must remain true even if the request is later amended.
 */
export function toTransferStatus(request: ServiceRequest): TransferStatus {
  if (request.status === "completed") return "Completed"
  if (request.status === "active") return "Approved"
  return "Pending"
}

export function toTransfer(request: ServiceRequest): Transfer {
  const toBed =
    request.extension?.find((e) => e.url === TRANSFER_TO_BED_EXTENSION_URL)?.valueReference
      ?.reference?.split("/")[1] ?? ""

  return {
    id: request.id ?? "",
    patientId: request.subject?.reference?.split("/")[1] ?? "",
    // Wards are resolved by the caller from each bed's partOf; the request
    // itself records beds, which is the precise thing being moved between.
    fromWardId: "",
    fromBedId: request.locationReference?.[0]?.reference?.split("/")[1] ?? "",
    toWardId: "",
    toBedId: toBed,
    requestedBy: request.requester?.display ?? request.requester?.reference ?? "",
    reason: request.reasonCode?.[0]?.text ?? "",
    date: request.authoredOn ?? request.meta?.lastUpdated ?? "",
    status: toTransferStatus(request),
  }
}

export interface BuildTransferInput {
  patientId: string
  encounterId: string
  fromBedId: string
  toBedId: string
  reason: string
  requester?: Reference<Practitioner | PractitionerRole>
}

export function buildTransferRequest(input: BuildTransferInput): ServiceRequest {
  return {
    resourceType: "ServiceRequest",
    // "draft" is the FHIR status for a request not yet acted on, which is what
    // Pending means here. Approval moves it to active, the move to completed.
    status: "draft",
    intent: "order",
    category: [{ coding: [TRANSFER_CATEGORY] }],
    code: { text: "Ward transfer" },
    subject: { reference: `Patient/${input.patientId}` },
    encounter: { reference: `Encounter/${input.encounterId}` },
    locationReference: [{ reference: `Location/${input.fromBedId}` }],
    authoredOn: new Date().toISOString(),
    ...(input.reason ? { reasonCode: [{ text: input.reason }] } : {}),
    ...(input.requester ? { requester: input.requester } : {}),
    // The destination bed has no standard field on ServiceRequest —
    // locationReference means "where the service happens", not "move to here".
    extension: [
      {
        url: TRANSFER_TO_BED_EXTENSION_URL,
        valueReference: { reference: `Location/${input.toBedId}` },
      },
    ],
  }
}
