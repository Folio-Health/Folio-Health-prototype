import type { Observation } from "@medplum/fhirtypes"

/**
 * Vital signs captured at triage, coded to LOINC the way every production EMR
 * files them (docs/research/emr-clinical-flows.md §4): one `Observation` per
 * sign, category `vital-signs`, effective time = when taken, performer = the
 * nurse. Blood pressure is a single panel observation with systolic and
 * diastolic components, per the FHIR vital-signs profile.
 */

export const LOINC = "http://loinc.org"
export const UCUM = "http://unitsofmeasure.org"

export interface VitalSignDef {
  key: string
  label: string
  loinc: string
  unit: string
  /** Sanity bounds for data entry — not clinical alert thresholds. */
  min: number
  max: number
  step?: number
}

export const VITAL_SIGNS: VitalSignDef[] = [
  { key: "systolic", label: "Systolic BP", loinc: "8480-6", unit: "mm[Hg]", min: 40, max: 300 },
  { key: "diastolic", label: "Diastolic BP", loinc: "8462-4", unit: "mm[Hg]", min: 20, max: 200 },
  { key: "temperature", label: "Temperature", loinc: "8310-5", unit: "Cel", min: 30, max: 45, step: 0.1 },
  { key: "heartRate", label: "Heart rate", loinc: "8867-4", unit: "/min", min: 20, max: 250 },
  { key: "respiratoryRate", label: "Respiratory rate", loinc: "9279-1", unit: "/min", min: 4, max: 80 },
  { key: "spo2", label: "SpO₂", loinc: "2708-6", unit: "%", min: 40, max: 100 },
  { key: "weight", label: "Weight", loinc: "29463-7", unit: "kg", min: 0.5, max: 400, step: 0.1 },
  { key: "height", label: "Height", loinc: "8302-2", unit: "cm", min: 20, max: 260 },
]

export const BP_PANEL_LOINC = "85354-9"

/** Display units (UCUM codes are not what a nurse reads). */
export const UNIT_LABELS: Record<string, string> = {
  "mm[Hg]": "mmHg",
  Cel: "°C",
  "/min": "/min",
  "%": "%",
  kg: "kg",
  cm: "cm",
}

export type VitalValues = Partial<Record<string, number>>

/** The three the nurse always takes; the rest are optional. */
export const REQUIRED_VITALS = ["systolic", "diastolic", "temperature", "heartRate"]

export function validateVitals(values: VitalValues): string | null {
  for (const key of REQUIRED_VITALS) {
    if (values[key] === undefined || Number.isNaN(values[key])) {
      const def = VITAL_SIGNS.find((v) => v.key === key)
      return `${def?.label ?? key} is required.`
    }
  }
  for (const def of VITAL_SIGNS) {
    const v = values[def.key]
    if (v === undefined) continue
    if (v < def.min || v > def.max) {
      return `${def.label} must be between ${def.min} and ${def.max} ${UNIT_LABELS[def.unit] ?? def.unit}.`
    }
  }
  if (values.systolic !== undefined && values.diastolic !== undefined && values.diastolic >= values.systolic) {
    return "Diastolic pressure must be lower than systolic."
  }
  return null
}

/**
 * Build the FHIR Observations for a set of vitals. BP becomes one panel
 * observation with two components; everything else is one observation each.
 */
export function buildVitalObservations(
  values: VitalValues,
  context: {
    patientRef: string
    encounterRef: string
    performerRef?: string
    performerDisplay?: string
    effective: string
  }
): Observation[] {
  const base = (): Omit<Observation, "code"> => ({
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
      },
    ],
    subject: { reference: context.patientRef },
    encounter: { reference: context.encounterRef },
    effectiveDateTime: context.effective,
    ...(context.performerRef
      ? { performer: [{ reference: context.performerRef, display: context.performerDisplay }] }
      : {}),
  })

  const out: Observation[] = []

  if (values.systolic !== undefined && values.diastolic !== undefined) {
    const sys = VITAL_SIGNS.find((v) => v.key === "systolic")!
    const dia = VITAL_SIGNS.find((v) => v.key === "diastolic")!
    out.push({
      ...base(),
      code: { coding: [{ system: LOINC, code: BP_PANEL_LOINC, display: "Blood pressure panel" }], text: "Blood pressure" },
      component: [
        {
          code: { coding: [{ system: LOINC, code: sys.loinc, display: sys.label }] },
          valueQuantity: { value: values.systolic, unit: "mmHg", system: UCUM, code: sys.unit },
        },
        {
          code: { coding: [{ system: LOINC, code: dia.loinc, display: dia.label }] },
          valueQuantity: { value: values.diastolic, unit: "mmHg", system: UCUM, code: dia.unit },
        },
      ],
    })
  }

  for (const def of VITAL_SIGNS) {
    if (def.key === "systolic" || def.key === "diastolic") continue
    const v = values[def.key]
    if (v === undefined || Number.isNaN(v)) continue
    out.push({
      ...base(),
      code: { coding: [{ system: LOINC, code: def.loinc, display: def.label }], text: def.label },
      valueQuantity: { value: v, unit: UNIT_LABELS[def.unit] ?? def.unit, system: UCUM, code: def.unit },
    })
  }

  return out
}

/** A one-line display for a vital observation ("Blood pressure 120/80 mmHg"). */
export function formatVital(observation: Observation): { label: string; value: string } {
  const code = observation.code?.coding?.[0]?.code
  if (code === BP_PANEL_LOINC) {
    const sys = observation.component?.find((c) => c.code?.coding?.[0]?.code === "8480-6")?.valueQuantity?.value
    const dia = observation.component?.find((c) => c.code?.coding?.[0]?.code === "8462-4")?.valueQuantity?.value
    return { label: "Blood pressure", value: sys !== undefined && dia !== undefined ? `${sys}/${dia} mmHg` : "—" }
  }
  const def = VITAL_SIGNS.find((v) => v.loinc === code)
  const q = observation.valueQuantity
  const value =
    q?.value !== undefined ? `${q.value} ${q.unit ?? UNIT_LABELS[q.code ?? ""] ?? ""}`.trim() : observation.valueString ?? "—"
  return { label: def?.label ?? observation.code?.text ?? "Observation", value }
}
