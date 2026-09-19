// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Patient } from "@/types/core"

/** Adult female patients eligible for obstetric care. */
const OB_ELIGIBLE: Patient[] = []

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

export const PREGNANCIES: Pregnancy[] = []

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

export const ANTENATAL_VISITS: AntenatalVisit[] = []

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

export const DELIVERY_RECORDS: DeliveryRecord[] = []

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

export const POSTNATAL_RECORDS: PostnatalRecord[] = []
