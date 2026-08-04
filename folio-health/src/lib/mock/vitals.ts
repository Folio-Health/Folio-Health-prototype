import { faker } from "@faker-js/faker"
import { seedFaker, id } from "./seed"
import type { VitalReading } from "@/types/core"
import { PATIENTS } from "./patients"
import { NURSES } from "./staff"

seedFaker(4)

function buildVitalsForPatient(patientId: string, patientHeight: number, count: number): VitalReading[] {
  const readings: VitalReading[] = []
  const baseSystolic = faker.number.int({ min: 110, max: 135 })
  const baseDiastolic = faker.number.int({ min: 70, max: 88 })
  const baseWeight = faker.number.int({ min: 50, max: 95 })

  for (let i = 0; i < count; i++) {
    const daysAgo = (count - i) * faker.number.int({ min: 20, max: 45 })
    const recordedAt = faker.date.recent({ days: daysAgo })
    const weight = baseWeight + faker.number.int({ min: -3, max: 3 })
    const heightM = patientHeight / 100

    readings.push({
      id: id(`VIT-${patientId}`, i + 1),
      patientId,
      recordedAt: recordedAt.toISOString(),
      recordedBy: faker.helpers.arrayElement(NURSES).name,
      bpSystolic: baseSystolic + faker.number.int({ min: -8, max: 8 }),
      bpDiastolic: baseDiastolic + faker.number.int({ min: -6, max: 6 }),
      pulse: faker.number.int({ min: 60, max: 100 }),
      temperature: Number(faker.number.float({ min: 36.1, max: 38.2, fractionDigits: 1 })),
      respiratoryRate: faker.number.int({ min: 14, max: 20 }),
      spo2: faker.number.int({ min: 94, max: 100 }),
      weight,
      height: patientHeight,
      bmi: Number((weight / (heightM * heightM)).toFixed(1)),
    })
  }

  return readings.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
}

const VITALS_BY_PATIENT = new Map<string, VitalReading[]>()
for (const patient of PATIENTS.slice(0, 60)) {
  VITALS_BY_PATIENT.set(
    patient.id,
    buildVitalsForPatient(patient.id, patient.height, faker.number.int({ min: 3, max: 8 }))
  )
}

export function getVitalsForPatient(patientId: string): VitalReading[] {
  return VITALS_BY_PATIENT.get(patientId) ?? []
}

export function getLatestVitalsForPatient(patientId: string): VitalReading | undefined {
  const readings = getVitalsForPatient(patientId)
  return readings[readings.length - 1]
}

/**
 * Flattens vital readings across all patients, most-recent first. Used by the
 * Vitals hub to show a cross-patient activity table.
 */
export function getAllRecentVitals(limit = 20): VitalReading[] {
  const all: VitalReading[] = []
  for (const readings of VITALS_BY_PATIENT.values()) {
    all.push(...readings)
  }
  return all.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, limit)
}
