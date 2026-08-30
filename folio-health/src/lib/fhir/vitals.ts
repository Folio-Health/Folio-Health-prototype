import type {
  Encounter,
  Observation,
  Practitioner,
  PractitionerRole,
  Reference,
  RelatedPerson,
} from "@medplum/fhirtypes"
import type { VitalReading } from "@/types/core"

/**
 * Vital signs ⇄ FHIR Observation.
 *
 * One `VitalReading` in the UI is one set of vitals taken at a moment. FHIR has
 * no "vitals row" resource: each measurement is its own Observation, coded with
 * LOINC. So a reading fans out to several Observations on write, and is
 * reassembled from them on read.
 *
 * They are tied together by a shared group identifier rather than by matching
 * timestamps. Two nurses recording on the same patient in the same second is
 * unlikely but not impossible, and a timestamp collision would silently merge
 * two patients' worth of numbers into one row. An explicit group id cannot.
 *
 * Blood pressure is the one exception to "one Observation per number": LOINC
 * models it as a panel (85354-9) carrying systolic and diastolic as components,
 * and splitting it into two unrelated Observations would lose that pairing.
 */

export const VITALS_GROUP_SYSTEM = "https://folio.health/fhir/sid/vitals-group"

/** LOINC codes for the vital-signs panel. */
const LOINC = {
  bloodPressure: "85354-9",
  systolic: "8480-6",
  diastolic: "8462-4",
  pulse: "8867-4",
  temperature: "8310-5",
  respiratoryRate: "9279-1",
  spo2: "2708-6",
  weight: "29463-7",
  height: "8302-2",
  bmi: "39156-5",
} as const

const LOINC_SYSTEM = "http://loinc.org"

/** Every Observation here is a vital sign — required by the FHIR vitals profile. */
const VITAL_SIGNS_CATEGORY = [
  {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs",
      },
    ],
  },
]

interface BuildOptions {
  patientId: string
  /** Practitioner who took the readings, when known. */
  performer?: Reference<Practitioner | PractitionerRole | RelatedPerson>
  /** Encounter these vitals belong to, when taken during one. */
  encounter?: Reference<Encounter>
  recordedAt?: string
}

function base(
  groupId: string,
  code: string,
  display: string,
  options: BuildOptions
): Observation {
  return {
    resourceType: "Observation",
    status: "final",
    category: VITAL_SIGNS_CATEGORY,
    code: { coding: [{ system: LOINC_SYSTEM, code, display }], text: display },
    subject: { reference: `Patient/${options.patientId}` },
    effectiveDateTime: options.recordedAt ?? new Date().toISOString(),
    identifier: [{ system: VITALS_GROUP_SYSTEM, value: groupId }],
    ...(options.performer ? { performer: [options.performer] } : {}),
    ...(options.encounter ? { encounter: options.encounter } : {}),
  }
}

function quantity(value: number, unit: string, code: string) {
  return { value, unit, system: "http://unitsofmeasure.org", code }
}

/** UCUM units, not display strings — a consumer must be able to convert. */
export function buildVitalObservations(
  values: Omit<VitalReading, "id" | "patientId" | "recordedAt" | "recordedBy" | "bmi">,
  options: BuildOptions
): Observation[] {
  // Grouped by a generated id so a reading can be reassembled exactly.
  const groupId = globalThis.crypto.randomUUID()
  const observations: Observation[] = []

  observations.push({
    ...base(groupId, LOINC.bloodPressure, "Blood pressure panel", options),
    component: [
      {
        code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.systolic, display: "Systolic blood pressure" }] },
        valueQuantity: quantity(values.bpSystolic, "mmHg", "mm[Hg]"),
      },
      {
        code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.diastolic, display: "Diastolic blood pressure" }] },
        valueQuantity: quantity(values.bpDiastolic, "mmHg", "mm[Hg]"),
      },
    ],
  })

  const singles: [string, string, number, string, string][] = [
    [LOINC.pulse, "Heart rate", values.pulse, "beats/minute", "/min"],
    [LOINC.temperature, "Body temperature", values.temperature, "Cel", "Cel"],
    [LOINC.respiratoryRate, "Respiratory rate", values.respiratoryRate, "breaths/minute", "/min"],
    [LOINC.spo2, "Oxygen saturation", values.spo2, "%", "%"],
    [LOINC.weight, "Body weight", values.weight, "kg", "kg"],
    [LOINC.height, "Body height", values.height, "cm", "cm"],
  ]
  for (const [code, display, value, unit, ucum] of singles) {
    observations.push({
      ...base(groupId, code, display, options),
      valueQuantity: quantity(value, unit, ucum),
    })
  }

  // BMI is derived, but stored: a reader should not have to recompute it, and
  // recomputing later from a corrected height would silently change history.
  const heightM = values.height / 100
  if (heightM > 0) {
    observations.push({
      ...base(groupId, LOINC.bmi, "Body mass index", options),
      valueQuantity: quantity(
        Number((values.weight / (heightM * heightM)).toFixed(1)),
        "kg/m2",
        "kg/m2"
      ),
    })
  }

  return observations
}

function groupIdOf(observation: Observation): string | undefined {
  return observation.identifier?.find((i) => i.system === VITALS_GROUP_SYSTEM)?.value
}

function codeOf(observation: Observation): string | undefined {
  return observation.code?.coding?.find((c) => c.system === LOINC_SYSTEM)?.code
}

function componentValue(observation: Observation, code: string): number {
  const match = observation.component?.find((c) =>
    c.code?.coding?.some((coding) => coding.code === code)
  )
  return match?.valueQuantity?.value ?? 0
}

/**
 * Reassemble Observations into UI readings, newest first.
 *
 * Observations without a group identifier are skipped rather than guessed at:
 * vitals written by another system may not follow this grouping convention, and
 * inventing a grouping for them would fabricate readings that were never taken.
 */
export function toVitalReadings(
  observations: Observation[],
  patientNames?: Map<string, string>
): VitalReading[] {
  const groups = new Map<string, Observation[]>()
  for (const observation of observations) {
    const groupId = groupIdOf(observation)
    if (!groupId) continue
    const existing = groups.get(groupId)
    if (existing) existing.push(observation)
    else groups.set(groupId, [observation])
  }

  const readings: VitalReading[] = []
  for (const [groupId, members] of groups) {
    const first = members[0]
    const patientId = first.subject?.reference?.split("/")[1]
    if (!patientId) continue

    const byCode = new Map<string, Observation>()
    for (const member of members) {
      const code = codeOf(member)
      if (code) byCode.set(code, member)
    }
    const value = (code: string) => byCode.get(code)?.valueQuantity?.value ?? 0
    const bp = byCode.get(LOINC.bloodPressure)

    readings.push({
      id: groupId,
      patientId,
      patientName: patientNames?.get(patientId),
      recordedAt: first.effectiveDateTime ?? first.meta?.lastUpdated ?? "",
      recordedBy: first.performer?.[0]?.display ?? "Unknown",
      bpSystolic: bp ? componentValue(bp, LOINC.systolic) : 0,
      bpDiastolic: bp ? componentValue(bp, LOINC.diastolic) : 0,
      pulse: value(LOINC.pulse),
      temperature: value(LOINC.temperature),
      respiratoryRate: value(LOINC.respiratoryRate),
      spo2: value(LOINC.spo2),
      weight: value(LOINC.weight),
      height: value(LOINC.height),
      bmi: value(LOINC.bmi),
    })
  }

  return readings.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
}

export const VITALS_CATEGORY_PARAM = "vital-signs"
