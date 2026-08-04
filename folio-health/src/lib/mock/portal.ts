import type { Patient } from "@/types/core"
import { PATIENTS } from "./patients"
import { getAppointmentsForPatient } from "./appointments"
import { getVitalsForPatient, getLatestVitalsForPatient } from "./vitals"
import { getStaffById } from "./staff"
import { LAB_RESULTS, type LabResult } from "./laboratory"
import { INVOICES, type Invoice } from "./billing"
import { PRESCRIPTIONS, type Prescription } from "./pharmacy"

/**
 * The Patient Portal has no real authentication — it always renders as one
 * hardcoded "logged in" patient. Rather than hardcoding an id (which might
 * land on a patient with a thin mock footprint), we score every patient that
 * has vitals recorded and pick whichever has the richest spread of
 * appointments / lab results / invoices / prescriptions, so every portal page
 * has something realistic to show.
 */
function pickDemoPatient(): Patient {
  const candidates = PATIENTS.slice(0, 60)
  let best = candidates[0]
  let bestScore = -1

  for (const p of candidates) {
    const score =
      getAppointmentsForPatient(p.id).length * 2 +
      LAB_RESULTS.filter((r) => r.patientId === p.id).length * 2 +
      INVOICES.filter((i) => i.patientId === p.id).length +
      PRESCRIPTIONS.filter((rx) => rx.patientId === p.id).length
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }

  return best
}

export const PORTAL_PATIENT: Patient = pickDemoPatient()

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
// Messages — a single ongoing thread between the demo patient and the
// hospital's care team / front desk. No real backend, just a seeded
// conversation the Messages page can append local, in-memory replies to.
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

const doctor = getStaffById(PORTAL_PATIENT.primaryDoctorId)
const careTeamName = doctor?.name ?? "Care Team"
const careTeamRole = doctor ? doctor.title : "Care Coordinator"

function daysAgoIso(days: number, hour = 9) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const PORTAL_MESSAGES: PortalMessage[] = [
  {
    id: "PMSG-0001",
    fromMe: false,
    senderName: "Front Desk",
    senderRole: "Patient Services",
    body: `Hi ${PORTAL_PATIENT.firstName}, this is a reminder that your recent lab results are ready to view in the portal. Let us know if you have any questions.`,
    sentAt: daysAgoIso(6, 10),
    read: true,
  },
  {
    id: "PMSG-0002",
    fromMe: true,
    senderName: "You",
    senderRole: "Patient",
    body: "Thank you! I'll take a look now. Should I be concerned about any of the flagged values?",
    sentAt: daysAgoIso(6, 11),
    read: true,
  },
  {
    id: "PMSG-0003",
    fromMe: false,
    senderName: careTeamName,
    senderRole: careTeamRole,
    body: "I reviewed your chart, nothing urgent, just keep up with your current medication and we'll recheck at your next visit.",
    sentAt: daysAgoIso(5, 15),
    read: true,
  },
  {
    id: "PMSG-0004",
    fromMe: true,
    senderName: "You",
    senderRole: "Patient",
    body: "That's a relief to hear. Also, could we move my upcoming appointment slightly later in the day if possible?",
    sentAt: daysAgoIso(2, 9),
    read: true,
  },
  {
    id: "PMSG-0005",
    fromMe: false,
    senderName: "Front Desk",
    senderRole: "Patient Services",
    body: "We've noted your request and will follow up with available afternoon slots shortly. Thanks for your patience!",
    sentAt: daysAgoIso(1, 16),
    read: false,
  },
]

export function getPortalUnreadMessageCount(): number {
  return PORTAL_MESSAGES.filter((m) => !m.fromMe && !m.read).length
}

// ---------------------------------------------------------------------------
// Downloads — documents the patient can pull from the portal. Derived from
// the demo patient's real lab results / invoices, plus a couple of static
// discharge-style documents.
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

function buildPortalDocuments(): PortalDocument[] {
  const docs: PortalDocument[] = [
    {
      id: "DOC-DISCHARGE-0001",
      title: `Discharge Summary: ${getPortalPastAppointments()[0]?.reason ?? "Recent Visit"}`,
      category: "Discharge Summary",
      date: getPortalPastAppointments()[0]?.startTime ?? daysAgoIso(30),
      fileType: "PDF",
      sizeKb: 184,
    },
  ]

  for (const result of getPortalLabResults().slice(0, 5)) {
    docs.push({
      id: `DOC-${result.id}`,
      title: `${result.testName} Lab Report`,
      category: "Lab Report",
      date: result.resultAt ?? result.orderedAt,
      fileType: "PDF",
      sizeKb: 96,
    })
  }

  for (const invoice of getPortalInvoices().slice(0, 5)) {
    docs.push({
      id: `DOC-${invoice.id}`,
      title: `Invoice ${invoice.id}: ${invoice.department}`,
      category: "Invoice",
      date: invoice.date,
      fileType: "PDF",
      sizeKb: 62,
    })
  }

  for (const rx of getPortalPrescriptions().slice(0, 3)) {
    docs.push({
      id: `DOC-${rx.id}`,
      title: `Prescription ${rx.id}: ${rx.medications.map((m) => m.drugName).join(", ")}`,
      category: "Prescription",
      date: rx.date,
      fileType: "PDF",
      sizeKb: 48,
    })
  }

  return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const PORTAL_DOCUMENTS: PortalDocument[] = buildPortalDocuments()

// ---------------------------------------------------------------------------
// Immunizations — not part of the core Patient type, so we seed a small
// realistic history for the demo patient's Medical Records page.
// ---------------------------------------------------------------------------

export interface PortalImmunization {
  vaccine: string
  dateGiven: string
  provider: string
}

export const PORTAL_IMMUNIZATIONS: PortalImmunization[] = [
  { vaccine: "Tetanus Diphtheria (Td) Booster", dateGiven: daysAgoIso(400), provider: "Folio Health Medical Centre" },
  { vaccine: "Influenza (Seasonal Flu)", dateGiven: daysAgoIso(200), provider: "Folio Health Medical Centre" },
  { vaccine: "Hepatitis B", dateGiven: daysAgoIso(900), provider: "Folio Health Medical Centre" },
  { vaccine: "COVID-19 Booster", dateGiven: daysAgoIso(150), provider: "Folio Health Medical Centre" },
]
