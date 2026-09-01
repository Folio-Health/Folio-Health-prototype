import type { Encounter, Practitioner, PractitionerRole, Reference } from "@medplum/fhirtypes"
import type { ERCase, ERStatus, TriageLevel } from "@/lib/mock/emergency"

/**
 * Emergency department to FHIR.
 *
 *   ERCase -> Encounter, class EMER
 *
 * The ED is an encounter type, not a separate domain: the same patient, the
 * same visit machinery, a different class code. Modelling it separately would
 * mean a patient admitted from the ED had two unrelated records of the same
 * stay.
 *
 * TRIAGE uses Encounter.priority, which FHIR intends for exactly this. The
 * five-level scale is Folio's (a local ESI/CTAS-style ladder), so it is coded
 * in Folio's own system rather than dressed up as a standard one — a "level 2"
 * means different things in different countries, and claiming a standard code
 * for a local scale is how that difference gets lost.
 */

export const TRIAGE_SYSTEM = "https://folio.health/fhir/sid/triage-level"

/** Trauma flag and mechanism, neither of which FHIR carries on an Encounter. */
export const TRAUMA_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/is-trauma"
export const MECHANISM_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/mechanism-of-injury"

const EMERGENCY_CLASS = {
  system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  code: "EMER",
  display: "emergency",
}

// -- Status -----------------------------------------------------------------

/**
 * ED status from the encounter.
 *
 * "Admitted" is not an Encounter status in FHIR — an admitted patient gets a
 * NEW inpatient encounter while the ED one finishes. It is inferred from the
 * discharge disposition rather than invented, so the board can still show where
 * the patient went.
 */
export function toErStatus(encounter: Encounter): ERStatus {
  const disposition = encounter.hospitalization?.dischargeDisposition?.coding?.[0]?.code
  if (encounter.status === "finished") {
    return disposition === "hosp" || disposition === "admitted" ? "Admitted" : "Discharged"
  }
  if (encounter.status === "in-progress") {
    // A clinician on the encounter means someone has picked the patient up.
    return encounter.participant?.length ? "In Treatment" : "Waiting"
  }
  return "Waiting"
}

export function toTriageLevel(encounter: Encounter): TriageLevel {
  const raw = encounter.priority?.coding?.find((c) => c.system === TRIAGE_SYSTEM)?.code
  const level = Number(raw)
  // Anything unrecognised lands at 3 (the middle of the scale) rather than 1:
  // defaulting an unknown case to "resuscitate now" would cry wolf on the board.
  return level >= 1 && level <= 5 ? (level as TriageLevel) : 3
}

// -- Reading ----------------------------------------------------------------

export function toErCase(encounter: Encounter): ERCase {
  const doctor = encounter.participant?.find((p) =>
    p.individual?.reference?.startsWith("Practitioner/")
  )

  return {
    id: encounter.id ?? "",
    patientId: encounter.subject?.reference?.split("/")[1] ?? "",
    chiefComplaint: encounter.reasonCode?.[0]?.text ?? "",
    triageLevel: toTriageLevel(encounter),
    arrivalTime: encounter.period?.start ?? encounter.meta?.lastUpdated ?? "",
    assignedDoctorId: doctor?.individual?.reference?.split("/")[1] ?? "",
    status: toErStatus(encounter),
    // Vitals are real Observations, read by the board from the vitals hook.
    // Zeros here would render as a patient with no pulse, so the caller fills
    // this from actual recorded readings.
    vitals: { hr: 0, bp: "—", spo2: 0, temp: 0, rr: 0 },
    isTrauma:
      encounter.extension?.some((e) => e.url === TRAUMA_EXTENSION_URL && e.valueBoolean === true) ??
      false,
    mechanismOfInjury: encounter.extension?.find((e) => e.url === MECHANISM_EXTENSION_URL)
      ?.valueString,
  }
}

// -- Writing ----------------------------------------------------------------

export interface BuildErCaseInput {
  patientId: string
  chiefComplaint: string
  triageLevel: TriageLevel
  isTrauma?: boolean
  mechanismOfInjury?: string
  doctor?: Reference<Practitioner | PractitionerRole>
}

export function buildErCase(input: BuildErCaseInput): Encounter {
  const extension = [
    ...(input.isTrauma ? [{ url: TRAUMA_EXTENSION_URL, valueBoolean: true }] : []),
    ...(input.mechanismOfInjury
      ? [{ url: MECHANISM_EXTENSION_URL, valueString: input.mechanismOfInjury }]
      : []),
  ]

  return {
    resourceType: "Encounter",
    status: "in-progress",
    class: EMERGENCY_CLASS,
    priority: {
      coding: [{ system: TRIAGE_SYSTEM, code: String(input.triageLevel) }],
      text: `Triage level ${input.triageLevel}`,
    },
    subject: { reference: `Patient/${input.patientId}` },
    period: { start: new Date().toISOString() },
    ...(input.chiefComplaint ? { reasonCode: [{ text: input.chiefComplaint }] } : {}),
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
    // Omitted entirely when empty: an empty extension[] is invalid FHIR.
    ...(extension.length ? { extension } : {}),
  }
}

/** Re-triage an existing case, preserving everything else on the encounter. */
export function withTriageLevel(encounter: Encounter, level: TriageLevel): Encounter {
  return {
    ...encounter,
    priority: {
      coding: [{ system: TRIAGE_SYSTEM, code: String(level) }],
      text: `Triage level ${level}`,
    },
  }
}

/** Assign a clinician, replacing any existing attender. */
export function withAttendingDoctor(
  encounter: Encounter,
  doctor: Reference<Practitioner | PractitionerRole>
): Encounter {
  const others = (encounter.participant ?? []).filter(
    (p) => !p.individual?.reference?.startsWith("Practitioner/")
  )
  return {
    ...encounter,
    participant: [
      ...others,
      {
        individual: doctor,
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
}

/**
 * Close an ED encounter.
 *
 * `admitted` records the disposition so the board can distinguish "went home"
 * from "went upstairs". Creating the inpatient Encounter is the admissions
 * module's job — this only ends the ED visit.
 */
export function closeErCase(encounter: Encounter, admitted: boolean): Encounter {
  const now = new Date().toISOString()
  return {
    ...encounter,
    status: "finished",
    period: { ...encounter.period, start: encounter.period?.start ?? now, end: now },
    hospitalization: {
      ...encounter.hospitalization,
      dischargeDisposition: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/discharge-disposition",
            code: admitted ? "hosp" : "home",
            display: admitted ? "Hospitalised" : "Home",
          },
        ],
      },
    },
  }
}
