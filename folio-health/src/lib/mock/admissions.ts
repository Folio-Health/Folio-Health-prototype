// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import { NURSES } from "@/lib/mock/staff"
import type { StaffMember } from "@/types/core"

export type BedStatus = "Available" | "Occupied" | "Reserved" | "Cleaning"
export type AdmissionStatus = "Admitted" | "Discharged"
export type TransferStatus = "Pending" | "Approved" | "Completed"
export type ICUStatus = "Critical" | "Stable" | "Improving"
export type TheatreBookingStatus = "Scheduled" | "In Progress" | "Completed"

export interface Ward {
  id: string
  name: string
  department: string
  capacity: number
  headNurseId: string
}

export interface Bed {
  id: string
  wardId: string
  label: string
  status: BedStatus
}

export interface Admission {
  id: string
  patientId: string
  wardId: string
  bedId: string
  doctorId: string
  admissionDate: string
  diagnosis: string
  status: AdmissionStatus
  dischargeDate?: string
  readyForDischarge?: boolean
  dischargeSummaryReady?: boolean
}

export interface Transfer {
  id: string
  patientId: string
  fromWardId: string
  fromBedId: string
  toWardId: string
  toBedId: string
  requestedBy: string
  reason: string
  date: string
  status: TransferStatus
}

export interface ICUPatient {
  admissionId: string
  patientId: string
  bedId: string
  status: ICUStatus
  onVentilator: boolean
  vitals: { hr: number; bp: string; spo2: number; temp: number }
}

export interface TheatreBooking {
  id: string
  theatreNumber: number
  procedure: string
  surgeonId: string
  time: string
  status: TheatreBookingStatus
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export const WARDS_LIST: Ward[] = []
export const BEDS_LIST: Bed[] = []
export const ADMISSIONS_LIST: Admission[] = []
export const TRANSFERS_LIST: Transfer[] = []
export const ICU_PATIENTS_LIST: ICUPatient[] = []
export const THEATRE_BOOKINGS_LIST: TheatreBooking[] = []

export function getWardById(wardId: string): Ward | undefined {
  return WARDS_LIST.find((w) => w.id === wardId)
}

export function getBedById(bedId: string): Bed | undefined {
  return BEDS_LIST.find((b) => b.id === bedId)
}

export function getBedsByWard(wardId: string): Bed[] {
  return BEDS_LIST.filter((b) => b.wardId === wardId)
}

export function getAdmissionByBedId(bedId: string): Admission | undefined {
  return ADMISSIONS_LIST.find((a) => a.bedId === bedId && a.status === "Admitted")
}

export function getActiveAdmissions(): Admission[] {
  return ADMISSIONS_LIST.filter((a) => a.status === "Admitted")
}

export function getHeadNurse(ward: Ward): StaffMember | undefined {
  return NURSES.find((n) => n.id === ward.headNurseId)
}

export function occupiedBedsCount(): number {
  return BEDS_LIST.filter((b) => b.status === "Occupied").length
}

export function availableBedsCount(): number {
  return BEDS_LIST.filter((b) => b.status === "Available").length
}

export function reservedBedsCount(): number {
  return BEDS_LIST.filter((b) => b.status === "Reserved").length
}

export function cleaningBedsCount(): number {
  return BEDS_LIST.filter((b) => b.status === "Cleaning").length
}

export function todaysAdmissionsCount(): number {
  return ADMISSIONS_LIST.filter((a) => isToday(a.admissionDate)).length
}

export function todaysDischargesCount(): number {
  return ADMISSIONS_LIST.filter(
    (a) => a.status === "Discharged" && a.dischargeDate && isToday(a.dischargeDate)
  ).length
}

export function averageLengthOfStay(): number {
  const discharged = ADMISSIONS_LIST.filter((a) => a.status === "Discharged" && a.dischargeDate)
  if (discharged.length === 0) return 0
  const totalDays = discharged.reduce((sum, a) => {
    const start = new Date(a.admissionDate).getTime()
    const end = new Date(a.dischargeDate!).getTime()
    return sum + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
  }, 0)
  return Math.round((totalDays / discharged.length) * 10) / 10
}

export function getPendingDischarges(): Admission[] {
  return ADMISSIONS_LIST.filter((a) => a.status === "Admitted" && a.readyForDischarge)
}

export function getAdmissionById(admissionId: string): Admission | undefined {
  return ADMISSIONS_LIST.find((a) => a.id === admissionId)
}

export { isToday }
