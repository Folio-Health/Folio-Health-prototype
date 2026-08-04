import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { PATIENTS } from "./patients"
import type { Patient } from "@/types/core"

seedFaker(41)

const NOW = new Date()

/** Pediatric patient roster — every registered patient under 18. */
export const PEDIATRIC_PATIENTS: Patient[] = PATIENTS.filter((p) => p.age < 18).sort(
  (a, b) => a.age - b.age
)

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

/** WHO-style child growth curve, roughly — generates a plausible upward trend with a percentile band that drifts slightly per patient. */
function buildGrowthRecords(patient: Patient): GrowthRecord[] {
  const ageMonthsNow = patient.age * 12
  const pointCount = Math.min(6, Math.max(3, Math.floor(ageMonthsNow / 6)))
  const records: GrowthRecord[] = []

  const basePercentile = faker.number.int({ min: 25, max: 85 })

  for (let i = 0; i < pointCount; i++) {
    const ageMonths = Math.round(((i + 1) / pointCount) * ageMonthsNow)
    // Rough pediatric growth approximation: birth ~50cm/3.5kg, converging toward the patient's current height/weight.
    const progress = ageMonthsNow > 0 ? ageMonths / ageMonthsNow : 1
    const heightCm = Math.round((50 + (patient.height - 50) * progress) * 10) / 10
    const weightKg = Math.round((3.5 + (patient.weight - 3.5) * progress) * 10) / 10
    const drift = faker.number.int({ min: -6, max: 6 })

    records.push({
      patientId: patient.id,
      ageMonths,
      date: new Date(NOW.getTime() - (ageMonthsNow - ageMonths) * 30 * 86400_000).toISOString(),
      heightCm,
      weightKg,
      heightPercentile: Math.min(99, Math.max(1, basePercentile + drift)),
      weightPercentile: Math.min(99, Math.max(1, basePercentile + drift + faker.number.int({ min: -8, max: 8 }))),
    })
  }

  return records
}

const GROWTH_BY_PATIENT = new Map<string, GrowthRecord[]>()
for (const patient of PEDIATRIC_PATIENTS) {
  GROWTH_BY_PATIENT.set(patient.id, buildGrowthRecords(patient))
}

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

const VACCINE_SCHEDULE = [
  { name: "BCG", doses: 1 },
  { name: "Hepatitis B", doses: 3 },
  { name: "Oral Polio Vaccine (OPV)", doses: 4 },
  { name: "Pentavalent (DPT HepB Hib)", doses: 3 },
  { name: "Pneumococcal Conjugate (PCV)", doses: 3 },
  { name: "Rotavirus", doses: 2 },
  { name: "Measles Rubella (MR)", doses: 2 },
  { name: "Yellow Fever", doses: 1 },
  { name: "Vitamin A Supplementation", doses: 2 },
  { name: "Meningococcal (MenA)", doses: 1 },
]

function buildVaccinations(): Vaccination[] {
  const records: Vaccination[] = []
  let counter = 1

  for (const patient of PEDIATRIC_PATIENTS) {
    const entryCount = faker.number.int({ min: 3, max: 6 })
    const entries = faker.helpers.arrayElements(VACCINE_SCHEDULE, entryCount)

    for (const vaccine of entries) {
      const doseNumber = faker.number.int({ min: 1, max: vaccine.doses })
      const dueRoll = faker.number.float({ min: 0, max: 1 })
      const dueDate =
        dueRoll < 0.5
          ? faker.date.past({ years: Math.min(patient.age, 5) || 0.5, refDate: NOW })
          : dueRoll < 0.75
            ? faker.date.soon({ days: 30, refDate: NOW })
            : faker.date.recent({ days: 60, refDate: NOW })

      const status: VaccinationStatus =
        dueRoll < 0.5
          ? "Completed"
          : dueDate.getTime() < NOW.getTime()
            ? "Overdue"
            : "Due"

      records.push({
        id: id("VAC", counter),
        patientId: patient.id,
        vaccineName: vaccine.name,
        doseNumber,
        dueDate: dueDate.toISOString(),
        status,
      })
      counter++
    }
  }

  return records.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export const VACCINATIONS: Vaccination[] = buildVaccinations()

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

const MILESTONES: { category: MilestoneCategory; milestone: string; expectedAgeMonths: number }[] = [
  { category: "Motor", milestone: "Holds head up unsupported", expectedAgeMonths: 4 },
  { category: "Motor", milestone: "Sits without support", expectedAgeMonths: 8 },
  { category: "Motor", milestone: "Walks independently", expectedAgeMonths: 14 },
  { category: "Motor", milestone: "Climbs stairs with alternating feet", expectedAgeMonths: 36 },
  { category: "Motor", milestone: "Rides a bicycle with training wheels", expectedAgeMonths: 60 },
  { category: "Language", milestone: "Babbles with consonant sounds", expectedAgeMonths: 8 },
  { category: "Language", milestone: "Says first words", expectedAgeMonths: 12 },
  { category: "Language", milestone: "Combines two words into phrases", expectedAgeMonths: 24 },
  { category: "Language", milestone: "Speaks in complete sentences", expectedAgeMonths: 42 },
  { category: "Language", milestone: "Follows multi step instructions", expectedAgeMonths: 54 },
  { category: "Social", milestone: "Smiles responsively", expectedAgeMonths: 2 },
  { category: "Social", milestone: "Shows stranger anxiety", expectedAgeMonths: 9 },
  { category: "Social", milestone: "Plays alongside other children", expectedAgeMonths: 24 },
  { category: "Social", milestone: "Engages in cooperative play", expectedAgeMonths: 48 },
  { category: "Social", milestone: "Shows empathy toward peers", expectedAgeMonths: 60 },
  { category: "Cognitive", milestone: "Tracks objects with eyes", expectedAgeMonths: 3 },
  { category: "Cognitive", milestone: "Understands object permanence", expectedAgeMonths: 9 },
  { category: "Cognitive", milestone: "Sorts shapes and colors", expectedAgeMonths: 30 },
  { category: "Cognitive", milestone: "Counts to ten", expectedAgeMonths: 48 },
  { category: "Cognitive", milestone: "Understands basic time concepts", expectedAgeMonths: 66 },
]

function buildDevelopmentMilestones(): DevelopmentMilestone[] {
  const records: DevelopmentMilestone[] = []
  let counter = 1

  for (const patient of PEDIATRIC_PATIENTS) {
    const ageMonths = patient.age * 12
    // Only track milestones expected within (or slightly beyond) the child's current age.
    const applicable = MILESTONES.filter((m) => m.expectedAgeMonths <= ageMonths + 12)
    const selected = applicable.length > 0 ? faker.helpers.arrayElements(applicable, Math.min(applicable.length, faker.number.int({ min: 2, max: 5 }))) : []

    for (const m of selected) {
      const status: MilestoneStatus =
        m.expectedAgeMonths < ageMonths - 6
          ? pick(["Achieved", "Achieved", "Achieved", "Delayed"] as const)
          : m.expectedAgeMonths <= ageMonths
            ? pick(["Achieved", "Achieved", "Pending"] as const)
            : "Pending"

      records.push({
        id: id("DEV", counter),
        patientId: patient.id,
        category: m.category,
        milestone: m.milestone,
        expectedAgeMonths: m.expectedAgeMonths,
        status,
      })
      counter++
    }
  }

  return records
}

export const DEVELOPMENT_MILESTONES: DevelopmentMilestone[] = buildDevelopmentMilestones()

export function getDevelopmentForPatient(patientId: string): DevelopmentMilestone[] {
  return DEVELOPMENT_MILESTONES.filter((d) => d.patientId === patientId)
}

export function getVaccinationsForPatient(patientId: string): Vaccination[] {
  return VACCINATIONS.filter((v) => v.patientId === patientId)
}
