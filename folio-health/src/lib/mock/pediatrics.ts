// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Patient } from "@/types/core"

/** Pediatric patient roster — every registered patient under 18. */
export const PEDIATRIC_PATIENTS: Patient[] = []

export function getPediatricPatientById(patientId: string): Patient | undefined {
  return PEDIATRIC_PATIENTS.find((p) => p.id === patientId)
}

/* ------------------------------------------------------------------ */
/* Growth Charts                                                        */
/* ------------------------------------------------------------------ */

export interface GrowthRecord {
  patientId: string
  ageMonths: number
  date: string
  heightCm: number
  weightKg: number
  heightPercentile: number
  weightPercentile: number
}

const GROWTH_BY_PATIENT = new Map<string, GrowthRecord[]>()

export function getGrowthRecordsForPatient(patientId: string): GrowthRecord[] {
  return GROWTH_BY_PATIENT.get(patientId) ?? []
}

export function getLatestGrowthRecord(patientId: string): GrowthRecord | undefined {
  const records = getGrowthRecordsForPatient(patientId)
  return records[records.length - 1]
}

/* ------------------------------------------------------------------ */
/* Vaccinations                                                         */
/* ------------------------------------------------------------------ */

export type VaccinationStatus = "Completed" | "Due" | "Overdue"

export interface Vaccination {
  id: string
  patientId: string
  vaccineName: string
  doseNumber: number
  dueDate: string
  status: VaccinationStatus
}

export const VACCINATIONS: Vaccination[] = []

/* ------------------------------------------------------------------ */
/* Development Tracking                                                 */
/* ------------------------------------------------------------------ */

export type MilestoneCategory = "Motor" | "Language" | "Social" | "Cognitive"
export type MilestoneStatus = "Achieved" | "Delayed" | "Pending"

export interface DevelopmentMilestone {
  id: string
  patientId: string
  category: MilestoneCategory
  milestone: string
  expectedAgeMonths: number
  status: MilestoneStatus
}

export const DEVELOPMENT_MILESTONES: DevelopmentMilestone[] = []

export function getDevelopmentForPatient(patientId: string): DevelopmentMilestone[] {
  return DEVELOPMENT_MILESTONES.filter((d) => d.patientId === patientId)
}

export function getVaccinationsForPatient(patientId: string): Vaccination[] {
  return VACCINATIONS.filter((v) => v.patientId === patientId)
}
