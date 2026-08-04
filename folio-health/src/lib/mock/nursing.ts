import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { PATIENTS } from "./patients"
import { NURSES } from "./staff"

seedFaker(40)

const NOW = new Date()

/** A pool of ~20 patients "assigned" to the nursing ward for this shift. */
const ASSIGNED_PATIENTS = faker.helpers.arrayElements(PATIENTS, 20)

const DIAGNOSES = [
  "Postoperative recovery",
  "Community acquired pneumonia",
  "Acute appendicitis (post op)",
  "Congestive heart failure",
  "Type 2 diabetes, uncontrolled",
  "Hypertensive crisis",
  "Sickle cell crisis",
  "Severe malaria",
  "Chronic kidney disease, stage 3",
  "Asthma exacerbation",
  "Postpartum recovery",
  "Fractured femur, traction",
  "Gastroenteritis with dehydration",
  "Sepsis, resolving",
  "Stroke rehabilitation",
]

export type NursingStatus = "Stable" | "Critical" | "Improving"

export interface NursingAssignment {
  id: string
  patientId: string
  room: string
  bed: string
  primaryDiagnosis: string
  status: NursingStatus
  assignedNurseId: string
}

function buildAssignments(): NursingAssignment[] {
  return ASSIGNED_PATIENTS.map((patient, i) => ({
    id: id("NAS", i + 1),
    patientId: patient.id,
    room: String(200 + Math.floor(i / 2) + 1),
    bed: i % 2 === 0 ? "A" : "B",
    primaryDiagnosis: pick(DIAGNOSES),
    status: pick(["Stable", "Stable", "Stable", "Improving", "Improving", "Critical"] as const),
    assignedNurseId: pick(NURSES).id,
  }))
}

export const NURSING_ASSIGNMENTS: NursingAssignment[] = buildAssignments()

export function getAssignmentByPatientId(patientId: string): NursingAssignment | undefined {
  return NURSING_ASSIGNMENTS.find((a) => a.patientId === patientId)
}

/* ------------------------------------------------------------------ */
/* Medication Administration Record (MAR)                              */
/* ------------------------------------------------------------------ */

const DRUG_DOSES = [
  { drug: "Amlodipine", dose: "5mg" },
  { drug: "Amoxicillin", dose: "500mg" },
  { drug: "Atorvastatin", dose: "20mg" },
  { drug: "Pantoprazole", dose: "40mg" },
  { drug: "Metformin", dose: "500mg" },
  { drug: "Paracetamol", dose: "1g" },
  { drug: "Ceftriaxone", dose: "1g IV" },
  { drug: "Insulin Glargine", dose: "10 units SC" },
  { drug: "Salbutamol", dose: "2 puffs" },
  { drug: "Furosemide", dose: "20mg IV" },
  { drug: "Tramadol", dose: "50mg" },
  { drug: "Omeprazole", dose: "20mg" },
]

export type MedicationStatus = "Given" | "Pending" | "Missed"

export interface MedicationOrder {
  id: string
  patientId: string
  drug: string
  dose: string
  scheduledTime: string
  status: MedicationStatus
  administeredByStaffId?: string
}

function buildMedicationOrders(): MedicationOrder[] {
  const orders: MedicationOrder[] = []
  let counter = 1
  const slots = [8, 10, 12, 14, 18, 22]

  for (const patient of ASSIGNED_PATIENTS) {
    const doseCount = faker.number.int({ min: 1, max: 3 })
    const meds = faker.helpers.arrayElements(DRUG_DOSES, doseCount)
    for (const med of meds) {
      const hour = pick(slots)
      const scheduled = new Date(NOW)
      scheduled.setHours(hour, pick([0, 15, 30]), 0, 0)
      const isPast = scheduled.getTime() < NOW.getTime()
      const status: MedicationStatus = isPast
        ? pick(["Given", "Given", "Given", "Missed"] as const)
        : "Pending"

      orders.push({
        id: id("MAR", counter),
        patientId: patient.id,
        drug: med.drug,
        dose: med.dose,
        scheduledTime: scheduled.toISOString(),
        status,
        administeredByStaffId: status === "Given" ? pick(NURSES).id : undefined,
      })
      counter++
    }
  }

  return orders.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
}

export const MEDICATION_ORDERS: MedicationOrder[] = buildMedicationOrders()

/* ------------------------------------------------------------------ */
/* Shift Notes                                                         */
/* ------------------------------------------------------------------ */

export type Shift = "Morning" | "Evening" | "Night"

export interface ShiftNote {
  id: string
  patientId: string
  nurseId: string
  shift: Shift
  time: string
  note: string
}

const SHIFT_NOTE_TEXTS = [
  "Patient resting comfortably, vitals stable throughout shift. Tolerating oral diet well.",
  "Pain reported at 6/10 post op; administered analgesic as charted, reassessed at 4/10 after 30 minutes.",
  "Ambulated to bathroom with assistance x2. No dizziness reported. Wound dressing dry and intact.",
  "Family visited, updated on care plan. Patient in good spirits, no new complaints.",
  "Slight fever noted (38.1°C), doctor notified, antipyretic given, will recheck next round.",
  "IV line patent, no signs of infiltration. Continuing fluids as ordered.",
  "Patient anxious about upcoming procedure; reassurance and education provided.",
  "Blood glucose checked before meal, within target range. Insulin administered per sliding scale.",
  "Catheter output adequate, urine clear. No signs of retention.",
  "Handover: continue current medication regimen, monitor input/output, repeat vitals q4h.",
]

function buildShiftNotes(): ShiftNote[] {
  const notes: ShiftNote[] = []
  const shifts: Shift[] = ["Morning", "Evening", "Night"]

  for (let i = 1; i <= 22; i++) {
    const patient = pick(ASSIGNED_PATIENTS)
    const shift = pick(shifts)
    const daysAgo = faker.number.int({ min: 0, max: 4 })
    const hour = shift === "Morning" ? 7 : shift === "Evening" ? 15 : 23
    const time = new Date(NOW)
    time.setDate(time.getDate() - daysAgo)
    time.setHours(hour, faker.number.int({ min: 0, max: 59 }), 0, 0)

    notes.push({
      id: id("SFN", i),
      patientId: patient.id,
      nurseId: pick(NURSES).id,
      shift,
      time: time.toISOString(),
      note: pick(SHIFT_NOTE_TEXTS),
    })
  }

  return notes.sort((a, b) => b.time.localeCompare(a.time))
}

export const SHIFT_NOTES: ShiftNote[] = buildShiftNotes()

/* ------------------------------------------------------------------ */
/* General Nursing Notes                                               */
/* ------------------------------------------------------------------ */

export interface NursingNote {
  id: string
  patientId: string
  note: string
  authorStaffId: string
  timestamp: string
}

const NURSING_NOTE_TEXTS = [
  "Wound assessed, clean and dry, no signs of infection. Dressing changed per protocol.",
  "Patient educated on medication compliance and follow up schedule prior to discharge planning.",
  "Assisted with mobility exercises as per physiotherapy plan. Tolerated well.",
  "Nutritional intake documented, patient consumed 75% of meal. Encouraged fluids.",
  "Skin integrity check completed, no pressure areas noted. Repositioned patient.",
  "Patient reports improved sleep. No overnight complaints logged.",
  "Reviewed discharge instructions with patient and caregiver, questions answered.",
  "Respiratory assessment: lungs clear bilaterally, SpO2 98% on room air.",
  "Emotional support provided; patient expressed anxiety about diagnosis, referred to counselor.",
  "Fall risk assessment completed, moderate risk, bed alarm activated per policy.",
]

function buildNursingNotes(): NursingNote[] {
  const notes: NursingNote[] = []
  for (let i = 1; i <= 24; i++) {
    const patient = pick(ASSIGNED_PATIENTS)
    notes.push({
      id: id("NNT", i),
      patientId: patient.id,
      note: pick(NURSING_NOTE_TEXTS),
      authorStaffId: pick(NURSES).id,
      timestamp: faker.date.recent({ days: 10, refDate: NOW }).toISOString(),
    })
  }
  return notes.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export const NURSING_NOTES: NursingNote[] = buildNursingNotes()

/* ------------------------------------------------------------------ */
/* Care Plans                                                           */
/* ------------------------------------------------------------------ */

export interface CarePlan {
  id: string
  patientId: string
  goal: string
  interventions: string[]
  targetDate: string
  progress: number
}

const CARE_GOALS: { goal: string; interventions: string[] }[] = [
  {
    goal: "Restore independent mobility after surgery",
    interventions: ["Daily physiotherapy sessions", "Pain management before exercises", "Assisted ambulation 3x daily"],
  },
  {
    goal: "Achieve stable blood glucose control",
    interventions: ["4x daily glucose monitoring", "Dietary consult and meal planning", "Insulin titration per sliding scale"],
  },
  {
    goal: "Prevent pressure ulcer development",
    interventions: ["Reposition every 2 hours", "Pressure relief mattress", "Daily skin integrity checks"],
  },
  {
    goal: "Reduce risk of hospital acquired infection",
    interventions: ["Strict hand hygiene protocol", "IV site monitored every shift", "Wound care per sterile technique"],
  },
  {
    goal: "Manage chronic pain to tolerable levels",
    interventions: ["Scheduled analgesia", "Pain scale assessment every 4 hours", "Non pharmacological comfort measures"],
  },
  {
    goal: "Support safe discharge and home recovery",
    interventions: ["Caregiver education sessions", "Medication reconciliation", "Follow up appointment scheduled"],
  },
  {
    goal: "Stabilize fluid and electrolyte balance",
    interventions: ["Strict input/output charting", "Daily weight monitoring", "Electrolyte panel every 48 hours"],
  },
]

function buildCarePlans(): CarePlan[] {
  return ASSIGNED_PATIENTS.slice(0, 16).map((patient, i) => {
    const template = pick(CARE_GOALS)
    return {
      id: id("CPL", i + 1),
      patientId: patient.id,
      goal: template.goal,
      interventions: template.interventions,
      targetDate: faker.date.soon({ days: 21, refDate: NOW }).toISOString(),
      progress: faker.number.int({ min: 10, max: 100 }),
    }
  })
}

export const CARE_PLANS: CarePlan[] = buildCarePlans()

/* ------------------------------------------------------------------ */
/* Nursing Tasks                                                        */
/* ------------------------------------------------------------------ */

export type TaskPriority = "Low" | "Medium" | "High"
export type TaskStatus = "Pending" | "In Progress" | "Done"

export interface NursingTask {
  id: string
  task: string
  patientId: string
  priority: TaskPriority
  dueTime: string
  status: TaskStatus
}

const TASK_TEMPLATES = [
  "Record vital signs",
  "Administer scheduled medication",
  "Change wound dressing",
  "Assist with ambulation",
  "Collect blood sample for labs",
  "Update fluid balance chart",
  "Reposition patient",
  "Educate patient on discharge plan",
  "Escort patient to radiology",
  "Check blood glucose",
  "Prepare patient for procedure",
  "Document intake and output",
]

function buildTasks(): NursingTask[] {
  const tasks: NursingTask[] = []
  for (let i = 1; i <= 20; i++) {
    const patient = pick(ASSIGNED_PATIENTS)
    const due = new Date(NOW)
    due.setHours(due.getHours() + faker.number.int({ min: -3, max: 8 }), pick([0, 15, 30, 45]), 0, 0)

    tasks.push({
      id: id("TSK", i),
      task: pick(TASK_TEMPLATES),
      patientId: patient.id,
      priority: pick(["Low", "Medium", "Medium", "High"] as const),
      dueTime: due.toISOString(),
      status: pick(["Pending", "Pending", "In Progress", "Done"] as const),
    })
  }
  return tasks.sort((a, b) => a.dueTime.localeCompare(b.dueTime))
}

export const NURSING_TASKS: NursingTask[] = buildTasks()
