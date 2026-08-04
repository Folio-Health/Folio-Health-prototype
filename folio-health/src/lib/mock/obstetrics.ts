import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { PATIENTS } from "./patients"
import { DOCTORS } from "./staff"
import type { Patient } from "@/types/core"

seedFaker(42)

const NOW = new Date()

/** Adult female patients eligible for obstetric care. */
const OB_ELIGIBLE: Patient[] = PATIENTS.filter(
  (p) => p.gender === "Female" && p.age >= 18 && p.age <= 44
)

const CURRENTLY_PREGNANT: Patient[] = faker.helpers.arrayElements(
  OB_ELIGIBLE,
  Math.min(16, OB_ELIGIBLE.length)
)

const ALREADY_DELIVERED: Patient[] = faker.helpers.arrayElements(
  OB_ELIGIBLE.filter((p) => !CURRENTLY_PREGNANT.some((c) => c.id === p.id)),
  Math.min(14, Math.max(0, OB_ELIGIBLE.length - CURRENTLY_PREGNANT.length))
)

export function getObPatientById(patientId: string): Patient | undefined {
  return OB_ELIGIBLE.find((p) => p.id === patientId)
}

/* ------------------------------------------------------------------ */
/* Pregnancy Timeline                                                   */
/* ------------------------------------------------------------------ */

export type RiskLevel = "Low" | "Medium" | "High"

export interface Pregnancy {
  id: string
  patientId: string
  gestationalWeek: number
  lmpDate: string
  edd: string
  riskLevel: RiskLevel
}

function buildPregnancies(): Pregnancy[] {
  return CURRENTLY_PREGNANT.map((patient, i) => {
    const gestationalWeek = faker.number.int({ min: 4, max: 39 })
    const lmp = new Date(NOW.getTime() - gestationalWeek * 7 * 86400_000)
    const edd = new Date(lmp.getTime() + 280 * 86400_000)

    return {
      id: id("PRG", i + 1),
      patientId: patient.id,
      gestationalWeek,
      lmpDate: lmp.toISOString(),
      edd: edd.toISOString(),
      riskLevel: pick(["Low", "Low", "Low", "Medium", "Medium", "High"] as const),
    }
  })
}

export const PREGNANCIES: Pregnancy[] = buildPregnancies()

export function getPregnancyByPatientId(patientId: string): Pregnancy | undefined {
  return PREGNANCIES.find((p) => p.patientId === patientId)
}

/* ------------------------------------------------------------------ */
/* Antenatal Visits                                                     */
/* ------------------------------------------------------------------ */

export interface AntenatalVisit {
  id: string
  patientId: string
  visitNumber: number
  gestationalWeek: number
  bpSystolic: number
  bpDiastolic: number
  weight: number
  fundalHeight: number
  nextVisitDate: string
}

function buildAntenatalVisits(): AntenatalVisit[] {
  const visits: AntenatalVisit[] = []
  let counter = 1

  for (const pregnancy of PREGNANCIES) {
    const visitCount = Math.max(1, Math.min(6, Math.floor(pregnancy.gestationalWeek / 6)))
    const baseWeight = faker.number.int({ min: 52, max: 78 })

    for (let v = 1; v <= visitCount; v++) {
      const weekAtVisit = Math.round((v / visitCount) * pregnancy.gestationalWeek)
      const nextVisit = new Date(
        NOW.getTime() + (pregnancy.gestationalWeek - weekAtVisit + 2) * 7 * 86400_000
      )

      visits.push({
        id: id("ANV", counter),
        patientId: pregnancy.patientId,
        visitNumber: v,
        gestationalWeek: weekAtVisit,
        bpSystolic: faker.number.int({ min: 100, max: 138 }),
        bpDiastolic: faker.number.int({ min: 64, max: 90 }),
        weight: baseWeight + v * faker.number.int({ min: 1, max: 2 }),
        fundalHeight: Math.max(8, weekAtVisit - faker.number.int({ min: 0, max: 2 })),
        nextVisitDate: nextVisit.toISOString(),
      })
      counter++
    }
  }

  return visits.sort((a, b) => b.nextVisitDate.localeCompare(a.nextVisitDate))
}

export const ANTENATAL_VISITS: AntenatalVisit[] = buildAntenatalVisits()

export function getAntenatalVisitsForPatient(patientId: string): AntenatalVisit[] {
  return ANTENATAL_VISITS.filter((v) => v.patientId === patientId)
}

/* ------------------------------------------------------------------ */
/* Delivery Records                                                     */
/* ------------------------------------------------------------------ */

export type DeliveryType = "Vaginal" | "C-Section"

export interface DeliveryRecord {
  id: string
  patientId: string
  deliveryDate: string
  type: DeliveryType
  babyWeight: number
  babyGender: "Male" | "Female"
  complications: string
  attendingDoctorId: string
}

const COMPLICATIONS = [
  "None",
  "None",
  "None",
  "None",
  "Postpartum hemorrhage, managed",
  "Prolonged labor",
  "Perineal tear, second degree",
  "Fetal distress, resolved with intervention",
  "Preeclampsia, monitored postpartum",
]

function buildDeliveryRecords(): DeliveryRecord[] {
  return ALREADY_DELIVERED.map((patient, i) => ({
    id: id("DLV", i + 1),
    patientId: patient.id,
    deliveryDate: faker.date.recent({ days: 200, refDate: NOW }).toISOString(),
    type: pick(["Vaginal", "Vaginal", "Vaginal", "C-Section"] as const),
    babyWeight: Number(faker.number.float({ min: 2.3, max: 4.2, fractionDigits: 1 })),
    babyGender: pick(["Male", "Female"] as const),
    complications: pick(COMPLICATIONS),
    attendingDoctorId: pick(DOCTORS).id,
  })).sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate))
}

export const DELIVERY_RECORDS: DeliveryRecord[] = buildDeliveryRecords()

export function getDeliveryForPatient(patientId: string): DeliveryRecord | undefined {
  return DELIVERY_RECORDS.find((d) => d.patientId === patientId)
}

/* ------------------------------------------------------------------ */
/* Postnatal Care                                                       */
/* ------------------------------------------------------------------ */

export type PostnatalStatus = "Scheduled" | "Completed" | "Missed"

export interface PostnatalRecord {
  id: string
  motherPatientId: string
  deliveryDate: string
  followUpDate: string
  motherCondition: string
  babyCondition: string
  status: PostnatalStatus
}

const CONDITIONS = [
  "Recovering well",
  "Stable, no concerns",
  "Mild anemia, iron supplementation started",
  "Wound healing appropriately",
  "Breastfeeding established well",
  "Mild jaundice, monitored",
  "Thriving, feeding well",
  "Weight gain on track",
]

function buildPostnatalRecords(): PostnatalRecord[] {
  return DELIVERY_RECORDS.map((delivery, i) => {
    const followUp = new Date(new Date(delivery.deliveryDate).getTime() + faker.number.int({ min: 5, max: 42 }) * 86400_000)
    const status: PostnatalStatus =
      followUp.getTime() > NOW.getTime()
        ? "Scheduled"
        : pick(["Completed", "Completed", "Completed", "Missed"] as const)

    return {
      id: id("PNC", i + 1),
      motherPatientId: delivery.patientId,
      deliveryDate: delivery.deliveryDate,
      followUpDate: followUp.toISOString(),
      motherCondition: pick(CONDITIONS),
      babyCondition: pick(CONDITIONS),
      status,
    }
  }).sort((a, b) => b.followUpDate.localeCompare(a.followUpDate))
}

export const POSTNATAL_RECORDS: PostnatalRecord[] = buildPostnatalRecords()
