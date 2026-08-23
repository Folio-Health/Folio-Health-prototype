// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
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

export const NURSING_ASSIGNMENTS: NursingAssignment[] = []

export function getAssignmentByPatientId(patientId: string): NursingAssignment | undefined {
  return NURSING_ASSIGNMENTS.find((a) => a.patientId === patientId)
}

/* ------------------------------------------------------------------ */
/* Medication Administration Record (MAR)                              */
/* ------------------------------------------------------------------ */

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

export const MEDICATION_ORDERS: MedicationOrder[] = []

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

export const SHIFT_NOTES: ShiftNote[] = []

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

export const NURSING_NOTES: NursingNote[] = []

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

export const CARE_PLANS: CarePlan[] = []

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

export const NURSING_TASKS: NursingTask[] = []
