// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
export type TriageLevel = 1 | 2 | 3 | 4 | 5
export type ERStatus = "Waiting" | "In Treatment" | "Admitted" | "Discharged"
export type AmbulanceStatus = "Dispatched" | "En Route" | "Arrived" | "Available"
export type CaseSeverity = "Minor" | "Moderate" | "Severe" | "Critical"

export interface ERVitals {
  hr: number
  bp: string
  spo2: number
  temp: number
  rr: number
}

export interface ERCase {
  id: string
  patientId: string
  chiefComplaint: string
  triageLevel: TriageLevel
  arrivalTime: string
  assignedDoctorId: string
  status: ERStatus
  vitals: ERVitals
  isTrauma: boolean
  mechanismOfInjury?: string
  severity?: CaseSeverity
}

export interface AmbulanceDispatch {
  id: string
  ambulanceId: string
  status: AmbulanceStatus
  destination: string
  etaMinutes: number
  crew: string[]
  patientId?: string
}

export const TRIAGE_LEVELS: {
  level: TriageLevel
  label: string
  description: string
  colorClass: string
  dotClass: string
  badgeLabel: "Critical" | "Urgent" | "Standard"
}[] = [
  {
    level: 1,
    label: "Level 1 · Critical",
    description: "Immediate, life-threatening",
    colorClass: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    dotClass: "bg-red-500",
    badgeLabel: "Critical",
  },
  {
    level: 2,
    label: "Level 2 · Emergent",
    description: "High risk, rapid deterioration possible",
    colorClass: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
    dotClass: "bg-orange-500",
    badgeLabel: "Critical",
  },
  {
    level: 3,
    label: "Level 3 · Urgent",
    description: "Stable but needs timely care",
    colorClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
    badgeLabel: "Urgent",
  },
  {
    level: 4,
    label: "Level 4 · Less Urgent",
    description: "Stable, minor complaint",
    colorClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-500",
    badgeLabel: "Standard",
  },
  {
    level: 5,
    label: "Level 5 · Non-Urgent",
    description: "Minor, no time-sensitive intervention",
    colorClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
    badgeLabel: "Standard",
  },
]

export function triageMeta(level: TriageLevel) {
  return TRIAGE_LEVELS.find((t) => t.level === level)!
}

export const ER_CASES_LIST: ERCase[] = []
export const AMBULANCE_DISPATCHES_LIST: AmbulanceDispatch[] = []

export function getERCaseById(caseId: string): ERCase | undefined {
  return ER_CASES_LIST.find((c) => c.id === caseId)
}

export function getActiveCases(): ERCase[] {
  return ER_CASES_LIST.filter((c) => c.status === "Waiting" || c.status === "In Treatment")
}

export function getCriticalCases(): ERCase[] {
  return ER_CASES_LIST.filter((c) => c.triageLevel <= 2)
}

export function getTraumaCases(): ERCase[] {
  return ER_CASES_LIST.filter((c) => c.isTrauma)
}

export function getWaitingQueue(): ERCase[] {
  return [...ER_CASES_LIST]
    .filter((c) => c.status === "Waiting")
    .sort((a, b) => a.triageLevel - b.triageLevel || +new Date(a.arrivalTime) - +new Date(b.arrivalTime))
}

export function casesByTriageLevel(): { label: string; value: number; color?: string }[] {
  return TRIAGE_LEVELS.map((t) => ({
    label: t.label.split(" · ")[1] ?? t.label,
    value: ER_CASES_LIST.filter((c) => c.triageLevel === t.level).length,
  }))
}

export function averageWaitMinutes(): number {
  const waiting = ER_CASES_LIST.filter((c) => c.status === "Waiting")
  if (waiting.length === 0) return 0
  const total = waiting.reduce((sum, c) => sum + (Date.now() - new Date(c.arrivalTime).getTime()) / 60000, 0)
  return Math.round(total / waiting.length)
}

export function longestWaitMinutes(): number {
  const waiting = ER_CASES_LIST.filter((c) => c.status === "Waiting")
  if (waiting.length === 0) return 0
  const oldest = waiting.reduce((earliest, c) =>
    new Date(c.arrivalTime) < new Date(earliest.arrivalTime) ? c : earliest
  )
  return Math.round((Date.now() - new Date(oldest.arrivalTime).getTime()) / 60000)
}
