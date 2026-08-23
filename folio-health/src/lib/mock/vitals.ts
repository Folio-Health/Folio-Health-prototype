// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { VitalReading } from "@/types/core"

const VITALS_BY_PATIENT = new Map<string, VitalReading[]>()

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
