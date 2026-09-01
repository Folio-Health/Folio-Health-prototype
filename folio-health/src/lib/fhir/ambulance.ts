import type { Basic, Reference } from "@medplum/fhirtypes"
import type { AmbulanceDispatch, AmbulanceStatus } from "@/lib/mock/emergency"
import {
  basicCode,
  fieldUrl,
  readNumber,
  readReference,
  readString,
} from "./custom"

/**
 * Ambulance dispatch, stored as `Basic` coded "ambulance-dispatch".
 *
 * FHIR R4 has no resource for a vehicle run. R5 adds `Transport`, which is
 * where this should move if the server is ever upgraded — the code below is
 * deliberately shaped like that resource's fields so the migration is a
 * rename rather than a redesign.
 *
 * Not modelled as an Encounter: a dispatch exists before there is a patient
 * (and sometimes without one at all), so hanging it off a patient encounter
 * would make an empty ambulance unrepresentable.
 */

const FIELD = {
  ambulanceId: fieldUrl("ambulance-dispatch", "ambulanceId"),
  status: fieldUrl("ambulance-dispatch", "status"),
  destination: fieldUrl("ambulance-dispatch", "destination"),
  eta: fieldUrl("ambulance-dispatch", "etaMinutes"),
  crew: fieldUrl("ambulance-dispatch", "crew"),
  patient: fieldUrl("ambulance-dispatch", "patient"),
} as const

export function toAmbulanceDispatch(basic: Basic): AmbulanceDispatch {
  const crewRaw = readString(basic.extension, FIELD.crew)
  return {
    id: basic.id ?? "",
    ambulanceId: readString(basic.extension, FIELD.ambulanceId) ?? "",
    status: (readString(basic.extension, FIELD.status) as AmbulanceStatus) ?? "Available",
    destination: readString(basic.extension, FIELD.destination) ?? "",
    // 0 means "no ETA recorded". An unknown ETA must not read as "arriving
    // now", so the UI shows a dash rather than the number when it is absent.
    etaMinutes: readNumber(basic.extension, FIELD.eta) ?? 0,
    crew: crewRaw ? crewRaw.split(",").map((name) => name.trim()).filter(Boolean) : [],
    patientId: readReference(basic.extension, FIELD.patient)?.split("/")[1],
  }
}

export interface BuildDispatchInput {
  ambulanceId: string
  status: AmbulanceStatus
  destination: string
  etaMinutes?: number
  crew?: string[]
  patient?: Reference
}

export function buildAmbulanceDispatch(input: BuildDispatchInput): Basic {
  return {
    resourceType: "Basic",
    code: basicCode("ambulance-dispatch"),
    created: new Date().toISOString().slice(0, 10),
    extension: [
      { url: FIELD.ambulanceId, valueString: input.ambulanceId },
      { url: FIELD.status, valueString: input.status },
      ...(input.destination ? [{ url: FIELD.destination, valueString: input.destination }] : []),
      ...(input.etaMinutes !== undefined
        ? [{ url: FIELD.eta, valueInteger: Math.max(0, Math.round(input.etaMinutes)) }]
        : []),
      // Crew is a comma-joined list. Names are free text from the dispatcher,
      // not Practitioner references — the crew on an ambulance is often not
      // staff with Folio accounts.
      ...(input.crew?.length ? [{ url: FIELD.crew, valueString: input.crew.join(", ") }] : []),
      ...(input.patient ? [{ url: FIELD.patient, valueReference: input.patient }] : []),
    ],
  }
}

/** Update a dispatch's status and ETA, preserving everything else. */
export function withDispatchStatus(
  basic: Basic,
  status: AmbulanceStatus,
  etaMinutes?: number
): Basic {
  const others = (basic.extension ?? []).filter(
    (e) => e.url !== FIELD.status && (etaMinutes === undefined || e.url !== FIELD.eta)
  )
  return {
    ...basic,
    extension: [
      ...others,
      { url: FIELD.status, valueString: status },
      ...(etaMinutes !== undefined
        ? [{ url: FIELD.eta, valueInteger: Math.max(0, Math.round(etaMinutes)) }]
        : []),
    ],
  }
}
