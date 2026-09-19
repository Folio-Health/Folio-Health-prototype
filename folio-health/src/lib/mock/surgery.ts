// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
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

const today = new Date()

export const SURGERIES_LIST: Surgery[] = []
export const THEATRES_LIST: Theatre[] = []
export const PRE_OP_CHECKLISTS_LIST: PreOpChecklist[] = []
export const PROCEDURE_NOTES_LIST: ProcedureNote[] = []
export const POST_OP_NOTES_LIST: PostOpNote[] = []
export const CONSENT_FORMS_LIST: ConsentForm[] = []

export function getSurgeryById(surgeryId: string): Surgery | undefined {
  return SURGERIES_LIST.find((s) => s.id === surgeryId)
}

export function getChecklistForSurgery(surgeryId: string): PreOpChecklist | undefined {
  return PRE_OP_CHECKLISTS_LIST.find((c) => c.surgeryId === surgeryId)
}

export function getProcedureNoteForSurgery(surgeryId: string): ProcedureNote | undefined {
  return PROCEDURE_NOTES_LIST.find((n) => n.surgeryId === surgeryId)
}

export function getPostOpNoteForSurgery(surgeryId: string): PostOpNote | undefined {
  return POST_OP_NOTES_LIST.find((n) => n.surgeryId === surgeryId)
}

export function getConsentFormBySurgeryId(surgeryId: string): ConsentForm | undefined {
  return CONSENT_FORMS_LIST.find((c) => c.surgeryId === surgeryId)
}

export function getConsentFormById(consentId: string): ConsentForm | undefined {
  return CONSENT_FORMS_LIST.find((c) => c.id === consentId)
}

export function todaysSurgeriesCount(): number {
  const todayStr = today.toISOString().slice(0, 10)
  return SURGERIES_LIST.filter((s) => s.date === todayStr).length
}

export function completedTodayCount(): number {
  const todayStr = today.toISOString().slice(0, 10)
  return SURGERIES_LIST.filter((s) => s.date === todayStr && s.status === "Completed").length
}

export function inProgressCount(): number {
  return SURGERIES_LIST.filter((s) => s.status === "In Progress").length
}

export function cancelledTodayCount(): number {
  const todayStr = today.toISOString().slice(0, 10)
  return SURGERIES_LIST.filter((s) => s.date === todayStr && s.status === "Cancelled").length
}

export function theatreUtilization(): number {
  if (THEATRES_LIST.length === 0) return 0
  const inUse = THEATRES_LIST.filter((t) => t.status === "In Use").length
  return Math.round((inUse / THEATRES_LIST.length) * 100)
}

export function checklistCompletion(checklist: PreOpChecklist | undefined): number {
  if (!checklist) return 0
  const values = Object.values(checklist.items)
  if (values.length === 0) return 0
  return Math.round((values.filter(Boolean).length / values.length) * 100)
}
