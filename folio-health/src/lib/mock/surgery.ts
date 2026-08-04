import { faker } from "@faker-js/faker"
import { seedFaker, pick, pickWeighted, id } from "@/lib/mock/seed"
import { PATIENTS } from "@/lib/mock/patients"
import { DOCTORS } from "@/lib/mock/staff"
import type { Patient } from "@/types/core"

seedFaker(31)

export type SurgeryStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled"
export type TheatreStatus = "In Use" | "Available" | "Cleaning"
export type RecoveryStatus = "Stable" | "Guarded" | "Critical"

export interface Surgery {
  id: string
  patientId: string
  procedure: string
  surgeonId: string
  anesthesiologistId: string
  theatreNumber: number
  date: string
  scheduledTime: string
  durationMinutes: number
  status: SurgeryStatus
}

export const PRE_OP_CHECKLIST_ITEMS = [
  { key: "consentSigned", label: "Consent Signed" },
  { key: "npoConfirmed", label: "Fasting Confirmed" },
  { key: "siteMarked", label: "Site Marked" },
  { key: "allergiesReviewed", label: "Allergies Reviewed" },
  { key: "labsReviewed", label: "Labs Done" },
  { key: "anesthesiaAssessment", label: "Anesthesia Review" },
  { key: "equipmentReady", label: "Equipment Ready" },
] as const

export type ChecklistItemKey = (typeof PRE_OP_CHECKLIST_ITEMS)[number]["key"]

export interface PreOpChecklist {
  surgeryId: string
  items: Record<ChecklistItemKey, boolean>
}

export interface ProcedureNote {
  surgeryId: string
  procedureDetails: string
  findings: string
  complications: string
  bloodLossMl: number
  createdAt: string
}

export interface PostOpNote {
  surgeryId: string
  recoveryStatus: RecoveryStatus
  vitalsCheckIns: { time: string; hr: number; bp: string; spo2: number }[]
  painScore: number
  complications: string
}

export interface ConsentForm {
  id: string
  surgeryId: string
  patientId: string
  procedure: string
  risks: string
  signed: boolean
  signedBy?: string
  date: string
}

export interface Theatre {
  number: number
  status: TheatreStatus
  currentSurgeryId?: string
}

const PROCEDURES = [
  "Appendectomy",
  "Cesarean Section",
  "Total Hip Replacement",
  "Laparoscopic Cholecystectomy",
  "Coronary Artery Bypass Graft",
  "Inguinal Hernia Repair",
  "Tonsillectomy & Adenoidectomy",
  "Cataract Extraction",
  "Open Reduction & Internal Fixation",
  "Exploratory Laparotomy",
  "Thyroidectomy",
  "Cystoscopy",
  "Spinal Fusion",
  "Mastectomy",
  "Skin Graft",
]

const shuffledPatients: Patient[] = faker.helpers.shuffle([...PATIENTS])
let cursor = 0
function nextPatient(): Patient {
  const p = shuffledPatients[cursor % shuffledPatients.length]
  cursor++
  return p
}

function surgeonPair() {
  const shuffled = faker.helpers.shuffle(DOCTORS)
  return { surgeon: shuffled[0], anesthesiologist: shuffled[1] ?? shuffled[0] }
}

const today = new Date()
function dateOffset(days: number) {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d
}

const SURGERIES: Surgery[] = []

// Yesterday: all completed/cancelled
for (let i = 0; i < 5; i++) {
  const { surgeon, anesthesiologist } = surgeonPair()
  const patient = nextPatient()
  const date = dateOffset(-1)
  SURGERIES.push({
    id: id("SRG", SURGERIES.length + 1),
    patientId: patient.id,
    procedure: pick(PROCEDURES),
    surgeonId: surgeon.id,
    anesthesiologistId: anesthesiologist.id,
    theatreNumber: (i % 6) + 1,
    date: date.toISOString().slice(0, 10),
    scheduledTime: date.toISOString(),
    durationMinutes: faker.number.int({ min: 45, max: 240 }),
    status: pickWeighted([
      { value: "Completed" as SurgeryStatus, weight: 8 },
      { value: "Cancelled" as SurgeryStatus, weight: 2 },
    ]),
  })
}

// Today: mix of completed, in progress, scheduled
const TODAY_STATUSES: SurgeryStatus[] = [
  "Completed",
  "Completed",
  "In Progress",
  "In Progress",
  "Scheduled",
  "Scheduled",
  "Scheduled",
  "Cancelled",
]
TODAY_STATUSES.forEach((status, i) => {
  const { surgeon, anesthesiologist } = surgeonPair()
  const patient = nextPatient()
  const hour = 7 + i * 2
  const scheduled = new Date(today)
  scheduled.setHours(hour, pick([0, 30]), 0, 0)
  SURGERIES.push({
    id: id("SRG", SURGERIES.length + 1),
    patientId: patient.id,
    procedure: pick(PROCEDURES),
    surgeonId: surgeon.id,
    anesthesiologistId: anesthesiologist.id,
    theatreNumber: (i % 6) + 1,
    date: today.toISOString().slice(0, 10),
    scheduledTime: scheduled.toISOString(),
    durationMinutes: faker.number.int({ min: 45, max: 240 }),
    status,
  })
})

// Next few days: scheduled
for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
  const date = dateOffset(dayOffset)
  const count = faker.number.int({ min: 2, max: 5 })
  for (let i = 0; i < count; i++) {
    const { surgeon, anesthesiologist } = surgeonPair()
    const patient = nextPatient()
    const hour = 8 + i * 2
    const scheduled = new Date(date)
    scheduled.setHours(hour, pick([0, 30]), 0, 0)
    SURGERIES.push({
      id: id("SRG", SURGERIES.length + 1),
      patientId: patient.id,
      procedure: pick(PROCEDURES),
      surgeonId: surgeon.id,
      anesthesiologistId: anesthesiologist.id,
      theatreNumber: (i % 6) + 1,
      date: date.toISOString().slice(0, 10),
      scheduledTime: scheduled.toISOString(),
      durationMinutes: faker.number.int({ min: 45, max: 240 }),
      status: "Scheduled",
    })
  }
}

// Theatres: derive current in-use theatre from any "In Progress" surgery today.
const THEATRES: Theatre[] = Array.from({ length: 6 }).map((_, i) => {
  const theatreNumber = i + 1
  const inProgress = SURGERIES.find(
    (s) => s.status === "In Progress" && s.theatreNumber === theatreNumber
  )
  if (inProgress) {
    return { number: theatreNumber, status: "In Use" as TheatreStatus, currentSurgeryId: inProgress.id }
  }
  const status = pickWeighted([
    { value: "Available" as TheatreStatus, weight: 6 },
    { value: "Cleaning" as TheatreStatus, weight: 3 },
  ])
  return { number: theatreNumber, status }
})

// Pre-op checklists for scheduled + in-progress surgeries.
const PRE_OP_CHECKLISTS: PreOpChecklist[] = SURGERIES.filter(
  (s) => s.status === "Scheduled" || s.status === "In Progress"
).map((s) => {
  const completeUpTo =
    s.status === "In Progress"
      ? PRE_OP_CHECKLIST_ITEMS.length
      : faker.number.int({ min: 0, max: PRE_OP_CHECKLIST_ITEMS.length })
  const items = {} as Record<ChecklistItemKey, boolean>
  PRE_OP_CHECKLIST_ITEMS.forEach((item, idx) => {
    items[item.key] = idx < completeUpTo
  })
  return { surgeryId: s.id, items }
})

// Procedure notes for completed + in-progress surgeries.
const FINDINGS = [
  "No intraoperative abnormalities noted; procedure completed as planned.",
  "Mild adhesions encountered and released without complication.",
  "Inflamed tissue excised; margins clear on visual inspection.",
  "Unexpected anatomical variant managed intraoperatively.",
  "Procedure uneventful; specimen sent to pathology.",
]
const COMPLICATIONS = [
  "None",
  "None",
  "None",
  "Minor bleeding, controlled with electrocautery",
  "Brief hypotension, resolved with fluids",
]

const PROCEDURE_NOTES: ProcedureNote[] = SURGERIES.filter(
  (s) => s.status === "Completed" || s.status === "In Progress"
).map((s) => ({
  surgeryId: s.id,
  procedureDetails: `${s.procedure} performed under general anesthesia in Theatre ${s.theatreNumber}.`,
  findings: pick(FINDINGS),
  complications: pick(COMPLICATIONS),
  bloodLossMl: faker.number.int({ min: 20, max: 600 }),
  createdAt: s.scheduledTime,
}))

// Post-op notes for completed surgeries only.
const POST_OP_NOTES: PostOpNote[] = SURGERIES.filter((s) => s.status === "Completed").map((s) => {
  const checkInCount = faker.number.int({ min: 2, max: 4 })
  const baseTime = new Date(s.scheduledTime)
  baseTime.setMinutes(baseTime.getMinutes() + s.durationMinutes)
  const vitalsCheckIns = Array.from({ length: checkInCount }).map((_, i) => {
    const t = new Date(baseTime)
    t.setMinutes(t.getMinutes() + i * 30)
    return {
      time: t.toISOString(),
      hr: faker.number.int({ min: 60, max: 110 }),
      bp: `${faker.number.int({ min: 100, max: 140 })}/${faker.number.int({ min: 60, max: 90 })}`,
      spo2: faker.number.int({ min: 93, max: 100 }),
    }
  })
  return {
    surgeryId: s.id,
    recoveryStatus: pickWeighted([
      { value: "Stable" as RecoveryStatus, weight: 7 },
      { value: "Guarded" as RecoveryStatus, weight: 2 },
      { value: "Critical" as RecoveryStatus, weight: 1 },
    ]),
    vitalsCheckIns,
    painScore: faker.number.int({ min: 0, max: 8 }),
    complications: pick(COMPLICATIONS),
  }
})

const RISK_TEXT =
  "I acknowledge that the risks, benefits, and alternatives to the proposed procedure have been explained to me, including but not limited to bleeding, infection, adverse reaction to anesthesia, and the possibility of unforeseen findings requiring additional treatment. I consent to the procedure and to the administration of anesthesia deemed necessary."

const CONSENT_FORMS: ConsentForm[] = SURGERIES.filter((s) => s.status !== "Cancelled")
  .slice(0, 10)
  .map((s, i) => {
    const patient = PATIENTS.find((p) => p.id === s.patientId)
    const signed = s.status === "Completed" || s.status === "In Progress" || faker.number.float({ min: 0, max: 1 }) > 0.25
    return {
      id: id("CNF", i + 1),
      surgeryId: s.id,
      patientId: s.patientId,
      procedure: s.procedure,
      risks: RISK_TEXT,
      signed,
      signedBy: signed ? pick([patient?.name ?? "Patient", `${patient?.emergencyContact.name ?? "Next of Kin"} (Next of Kin)`]) : undefined,
      date: s.scheduledTime,
    }
  })

export const SURGERIES_LIST = SURGERIES
export const THEATRES_LIST = THEATRES
export const PRE_OP_CHECKLISTS_LIST = PRE_OP_CHECKLISTS
export const PROCEDURE_NOTES_LIST = PROCEDURE_NOTES
export const POST_OP_NOTES_LIST = POST_OP_NOTES
export const CONSENT_FORMS_LIST = CONSENT_FORMS

export function getSurgeryById(surgeryId: string): Surgery | undefined {
  return SURGERIES.find((s) => s.id === surgeryId)
}

export function getChecklistForSurgery(surgeryId: string): PreOpChecklist | undefined {
  return PRE_OP_CHECKLISTS.find((c) => c.surgeryId === surgeryId)
}

export function getProcedureNoteForSurgery(surgeryId: string): ProcedureNote | undefined {
  return PROCEDURE_NOTES.find((n) => n.surgeryId === surgeryId)
}

export function getPostOpNoteForSurgery(surgeryId: string): PostOpNote | undefined {
  return POST_OP_NOTES.find((n) => n.surgeryId === surgeryId)
}

export function getConsentFormBySurgeryId(surgeryId: string): ConsentForm | undefined {
  return CONSENT_FORMS.find((c) => c.surgeryId === surgeryId)
}

export function getConsentFormById(consentId: string): ConsentForm | undefined {
  return CONSENT_FORMS.find((c) => c.id === consentId)
}

export function todaysSurgeriesCount(): number {
  const todayStr = today.toISOString().slice(0, 10)
  return SURGERIES.filter((s) => s.date === todayStr).length
}

export function completedTodayCount(): number {
  const todayStr = today.toISOString().slice(0, 10)
  return SURGERIES.filter((s) => s.date === todayStr && s.status === "Completed").length
}

export function inProgressCount(): number {
  return SURGERIES.filter((s) => s.status === "In Progress").length
}

export function cancelledTodayCount(): number {
  const todayStr = today.toISOString().slice(0, 10)
  return SURGERIES.filter((s) => s.date === todayStr && s.status === "Cancelled").length
}

export function theatreUtilization(): number {
  const inUse = THEATRES.filter((t) => t.status === "In Use").length
  return Math.round((inUse / THEATRES.length) * 100)
}

export function checklistCompletion(checklist: PreOpChecklist | undefined): number {
  if (!checklist) return 0
  const values = Object.values(checklist.items)
  if (values.length === 0) return 0
  return Math.round((values.filter(Boolean).length / values.length) * 100)
}
