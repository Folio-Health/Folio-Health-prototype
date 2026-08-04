import { faker } from "@faker-js/faker"
import { seedFaker, pick, pickWeighted, id } from "@/lib/mock/seed"
import { PATIENTS } from "@/lib/mock/patients"
import { DOCTORS } from "@/lib/mock/staff"
import type { Patient } from "@/types/core"

seedFaker(32)

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

const CHIEF_COMPLAINTS = [
  "Chest pain",
  "Shortness of breath",
  "Severe abdominal pain",
  "Laceration - hand",
  "Motor vehicle collision injuries",
  "Fall from height",
  "High fever with confusion",
  "Allergic reaction",
  "Seizure",
  "Head injury with loss of consciousness",
  "Ankle sprain",
  "Minor burn",
  "Severe headache",
  "Suspected stroke - facial droop",
  "Gunshot wound",
  "Stab wound",
  "Overdose / poisoning",
  "Asthma exacerbation",
  "Fracture - forearm",
  "Sore throat and cough",
  "Chemical splash to eye",
  "Palpitations",
  "Dehydration",
  "Back pain",
]

const TRAUMA_MECHANISMS = [
  "Motor vehicle collision",
  "Pedestrian struck by vehicle",
  "Fall from height (>2m)",
  "Assault - blunt trauma",
  "Penetrating trauma - gunshot",
  "Penetrating trauma - stab wound",
  "Industrial machinery accident",
  "Sports injury - collision",
  "Motorcycle accident",
  "Domestic fall",
]

const shuffledPatients: Patient[] = faker.helpers.shuffle([...PATIENTS])
let cursor = 0
function nextPatient(): Patient {
  const p = shuffledPatients[cursor % shuffledPatients.length]
  cursor++
  return p
}

function vitalsForLevel(level: TriageLevel): ERVitals {
  const severityFactor = (6 - level) / 5 // 1 => most deranged, 5 => near normal
  return {
    hr: Math.round(78 + severityFactor * faker.number.int({ min: 10, max: 55 }) * pick([1, -1, 1])),
    bp: `${Math.round(118 - severityFactor * faker.number.int({ min: 0, max: 35 }))}/${Math.round(
      76 - severityFactor * faker.number.int({ min: 0, max: 20 })
    )}`,
    spo2: Math.max(80, Math.round(99 - severityFactor * faker.number.int({ min: 0, max: 16 }))),
    temp: Number((36.8 + severityFactor * faker.number.float({ min: -0.4, max: 1.8 })).toFixed(1)),
    rr: Math.round(16 + severityFactor * faker.number.int({ min: 0, max: 14 })),
  }
}

const ER_CASES: ERCase[] = Array.from({ length: 34 }).map((_, i) => {
  const patient = nextPatient()
  const triageLevel = pickWeighted([
    { value: 1 as TriageLevel, weight: 2 },
    { value: 2 as TriageLevel, weight: 5 },
    { value: 3 as TriageLevel, weight: 10 },
    { value: 4 as TriageLevel, weight: 9 },
    { value: 5 as TriageLevel, weight: 6 },
  ])
  const isTrauma =
    triageLevel <= 3 ? faker.number.float({ min: 0, max: 1 }) > 0.55 : faker.number.float({ min: 0, max: 1 }) > 0.85
  const status = pickWeighted([
    { value: "Waiting" as ERStatus, weight: triageLevel >= 4 ? 6 : 3 },
    { value: "In Treatment" as ERStatus, weight: 6 },
    { value: "Admitted" as ERStatus, weight: triageLevel <= 2 ? 4 : 2 },
    { value: "Discharged" as ERStatus, weight: 3 },
  ])
  return {
    id: id("ER", i + 1),
    patientId: patient.id,
    chiefComplaint: isTrauma ? pick(["Motor vehicle collision injuries", "Fall from height", "Laceration - hand", "Head injury with loss of consciousness"]) : pick(CHIEF_COMPLAINTS),
    triageLevel,
    arrivalTime: faker.date.recent({ days: 1 }).toISOString(),
    assignedDoctorId: pick(DOCTORS).id,
    status,
    vitals: vitalsForLevel(triageLevel),
    isTrauma,
    mechanismOfInjury: isTrauma ? pick(TRAUMA_MECHANISMS) : undefined,
    severity: isTrauma
      ? pickWeighted([
          { value: "Critical" as CaseSeverity, weight: triageLevel === 1 ? 4 : 1 },
          { value: "Severe" as CaseSeverity, weight: triageLevel <= 2 ? 4 : 2 },
          { value: "Moderate" as CaseSeverity, weight: 3 },
          { value: "Minor" as CaseSeverity, weight: 2 },
        ])
      : undefined,
  }
})
  // Sorted so the queue reads naturally: highest acuity + earliest arrival first.
  .sort((a, b) => a.triageLevel - b.triageLevel || +new Date(a.arrivalTime) - +new Date(b.arrivalTime))

const AMBULANCE_CREW_ROLES = ["Paramedic", "EMT", "Driver"]
const DESTINATIONS = [
  "Folio Health General Hospital - ER Bay 1",
  "Folio Health General Hospital - ER Bay 2",
  "Folio Health General Hospital - ER Bay 3",
  "Folio Health General Hospital - Trauma Bay",
]

const AMBULANCE_DISPATCHES: AmbulanceDispatch[] = Array.from({ length: 8 }).map((_, i) => {
  const status = pickWeighted([
    { value: "Dispatched" as AmbulanceStatus, weight: 2 },
    { value: "En Route" as AmbulanceStatus, weight: 3 },
    { value: "Arrived" as AmbulanceStatus, weight: 2 },
    { value: "Available" as AmbulanceStatus, weight: 3 },
  ])
  const crew = Array.from({ length: 2 }).map(
    (_, ci) => `${faker.person.fullName()} (${AMBULANCE_CREW_ROLES[ci % AMBULANCE_CREW_ROLES.length]})`
  )
  const linkedCase = status !== "Available" ? pick(ER_CASES) : undefined
  return {
    id: id("AMB", i + 1),
    ambulanceId: `AMB-${String(101 + i)}`,
    status,
    destination: status === "Available" ? "Standing by - Station 1" : pick(DESTINATIONS),
    etaMinutes: status === "En Route" ? faker.number.int({ min: 3, max: 25 }) : status === "Dispatched" ? faker.number.int({ min: 8, max: 30 }) : 0,
    crew,
    patientId: linkedCase?.patientId,
  }
})

export const ER_CASES_LIST = ER_CASES
export const AMBULANCE_DISPATCHES_LIST = AMBULANCE_DISPATCHES

export function getERCaseById(caseId: string): ERCase | undefined {
  return ER_CASES.find((c) => c.id === caseId)
}

export function getActiveCases(): ERCase[] {
  return ER_CASES.filter((c) => c.status === "Waiting" || c.status === "In Treatment")
}

export function getCriticalCases(): ERCase[] {
  return ER_CASES.filter((c) => c.triageLevel <= 2)
}

export function getTraumaCases(): ERCase[] {
  return ER_CASES.filter((c) => c.isTrauma)
}

export function getWaitingQueue(): ERCase[] {
  return [...ER_CASES]
    .filter((c) => c.status === "Waiting")
    .sort((a, b) => a.triageLevel - b.triageLevel || +new Date(a.arrivalTime) - +new Date(b.arrivalTime))
}

export function casesByTriageLevel(): { label: string; value: number; color?: string }[] {
  return TRIAGE_LEVELS.map((t) => ({
    label: t.label.split(" · ")[1] ?? t.label,
    value: ER_CASES.filter((c) => c.triageLevel === t.level).length,
  }))
}

export function averageWaitMinutes(): number {
  const waiting = ER_CASES.filter((c) => c.status === "Waiting")
  if (waiting.length === 0) return 0
  const total = waiting.reduce((sum, c) => sum + (Date.now() - new Date(c.arrivalTime).getTime()) / 60000, 0)
  return Math.round(total / waiting.length)
}

export function longestWaitMinutes(): number {
  const waiting = ER_CASES.filter((c) => c.status === "Waiting")
  if (waiting.length === 0) return 0
  const oldest = waiting.reduce((earliest, c) =>
    new Date(c.arrivalTime) < new Date(earliest.arrivalTime) ? c : earliest
  )
  return Math.round((Date.now() - new Date(oldest.arrivalTime).getTime()) / 60000)
}
