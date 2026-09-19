// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Patient } from "@/types/core"
import { getAppointmentsForPatient } from "./appointments"
import { getVitalsForPatient, getLatestVitalsForPatient } from "./vitals"
import { getStaffById } from "./staff"
import { LAB_RESULTS, type LabResult } from "./laboratory"
import { INVOICES, type Invoice } from "./billing"
import { PRESCRIPTIONS, type Prescription } from "./pharmacy"

/**
 * The Patient Portal has no real authentication — it renders as one hardcoded
 * "logged in" patient. With mock records removed there is no patient database,
 * so this is an empty placeholder record: every portal page derives from it
 * and therefore shows the true (empty) state.
 */
export const PORTAL_PATIENT: Patient = {
  id: "",
  mrn: "",
  name: "",
  firstName: "",
  lastName: "",
  gender: "Other",
  dob: "",
  age: 0,
  bloodGroup: "O+",
  phone: "",
  email: "",
  address: { line1: "", city: "", state: "", postalCode: "", country: "" },
  avatarSeed: "",
  status: "Inactive",
  registeredAt: "",
  lastVisit: "",
  primaryDoctorId: "",
  department: "General Medicine",
  allergies: [],
  chronicConditions: [],
  emergencyContact: { name: "", relationship: "", phone: "" },
  insurance: { provider: "", policyNumber: "", plan: "", validTill: "" },
  maritalStatus: "Single",
  occupation: "",
  height: 0,
  weight: 0,
}

export function getPortalDoctor() {
  return getStaffById(PORTAL_PATIENT.primaryDoctorId)
}

export function getPortalAppointments() {
  return getAppointmentsForPatient(PORTAL_PATIENT.id)
}

export function getPortalUpcomingAppointments() {
  const now = Date.now()
  return getPortalAppointments()
    .filter((a) => new Date(a.startTime).getTime() >= now && a.status !== "Cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

export function getPortalPastAppointments() {
  const now = Date.now()
  return getPortalAppointments()
    .filter((a) => new Date(a.startTime).getTime() < now || a.status === "Completed")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
}

export function getPortalVitals() {
  return getVitalsForPatient(PORTAL_PATIENT.id)
}

export function getPortalLatestVitals() {
  return getLatestVitalsForPatient(PORTAL_PATIENT.id)
}

export function getPortalLabResults(): LabResult[] {
  return LAB_RESULTS.filter((r) => r.patientId === PORTAL_PATIENT.id).sort(
    (a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()
  )
}

export function getPortalInvoices(): Invoice[] {
  return INVOICES.filter((i) => i.patientId === PORTAL_PATIENT.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPortalPrescriptions(): Prescription[] {
  return PRESCRIPTIONS.filter((rx) => rx.patientId === PORTAL_PATIENT.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPortalActivePrescriptionCount(): number {
  return getPortalPrescriptions().filter((rx) => rx.status === "To Dispense").length
}

export function getPortalOutstandingBalance(): number {
  return getPortalInvoices().reduce((sum, inv) => sum + inv.balance, 0)
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface PortalMessage {
  id: string
  fromMe: boolean
  senderName: string
  senderRole: string
  body: string
  sentAt: string
  read: boolean
}

export const PORTAL_MESSAGES: PortalMessage[] = []

export function getPortalUnreadMessageCount(): number {
  return PORTAL_MESSAGES.filter((m) => !m.fromMe && !m.read).length
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

export type PortalDocumentCategory =
  | "Discharge Summary"
  | "Lab Report"
  | "Invoice"
  | "Prescription"

export interface PortalDocument {
  id: string
  title: string
  category: PortalDocumentCategory
  date: string
  fileType: "PDF"
  sizeKb: number
}

export const PORTAL_DOCUMENTS: PortalDocument[] = []

// ---------------------------------------------------------------------------
// Immunizations
// ---------------------------------------------------------------------------

export interface PortalImmunization {
  vaccine: string
  dateGiven: string
  provider: string
}

export const PORTAL_IMMUNIZATIONS: PortalImmunization[] = []
