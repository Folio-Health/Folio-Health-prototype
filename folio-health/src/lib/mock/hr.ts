// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import { STAFF, DOCTORS } from "./staff"
import type { Department } from "@/types/core"
import { DEPARTMENTS } from "@/types/core"

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

export type AttendanceStatus = "Present" | "Absent" | "Late"

export interface AttendanceRecord {
  id: string
  staffId: string
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number
  status: AttendanceStatus
}

export const ATTENDANCE_RECORDS: AttendanceRecord[] = []

/* ------------------------------------------------------------------ */
/* Leave management                                                    */
/* ------------------------------------------------------------------ */

export type LeaveType = "Annual" | "Sick" | "Maternity" | "Emergency"
export type LeaveStatus = "Pending" | "Approved" | "Rejected"

export interface LeaveRequest {
  id: string
  staffId: string
  leaveType: LeaveType
  from: string
  to: string
  days: number
  status: LeaveStatus
  requestedAt: string
  reason: string
}

export const LEAVE_REQUESTS: LeaveRequest[] = []

/* ------------------------------------------------------------------ */
/* Shift planner                                                       */
/* ------------------------------------------------------------------ */

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
export type WeekDay = (typeof WEEK_DAYS)[number]
export type ShiftValue = "Morning" | "Evening" | "Night" | "Off"

export const WEEKLY_SHIFTS: Record<string, Record<WeekDay, ShiftValue>> = {}

/* ------------------------------------------------------------------ */
/* Departments (shared by HR + Administration)                         */
/* ------------------------------------------------------------------ */

export interface DepartmentSummary {
  department: Department
  staffCount: number
  head: string
  description: string
  status: "Active"
}

const DEPARTMENT_DESCRIPTIONS: Record<Department, string> = {
  "General Medicine": "Primary and preventive care for adult patients across all specialties.",
  Cardiology: "Diagnosis and treatment of heart and cardiovascular conditions.",
  Pediatrics: "Comprehensive medical care for infants, children, and adolescents.",
  "Obstetrics & Gynecology": "Reproductive health, prenatal care, and childbirth services.",
  Orthopedics: "Care for bones, joints, ligaments, and the musculoskeletal system.",
  Neurology: "Diagnosis and treatment of disorders of the brain and nervous system.",
  Oncology: "Cancer screening, diagnosis, chemotherapy, and survivorship care.",
  Dermatology: "Skin, hair, and nail conditions including minor dermatologic procedures.",
  ENT: "Ear, nose, and throat diagnostics, surgery, and hearing services.",
  Ophthalmology: "Eye examinations, vision correction, and ocular surgery.",
  Psychiatry: "Mental health assessment, counselling, and psychiatric treatment.",
  "Emergency Medicine": "24/7 acute and trauma care for critical and urgent conditions.",
  Radiology: "Diagnostic imaging including X ray, CT, MRI, and ultrasound services.",
  Laboratory: "Clinical pathology, blood work, and diagnostic lab testing.",
  Pharmacy: "Medication dispensing, drug inventory, and clinical pharmacy services.",
  Surgery: "Elective and emergency surgical procedures across specialties.",
  "Intensive Care Unit": "Critical care monitoring and life support for severely ill patients.",
  Nephrology: "Kidney disease management, dialysis, and renal care.",
  Urology: "Diagnosis and treatment of the urinary tract and male reproductive system.",
  Administration: "Hospital operations, records, HR, and administrative support.",
}

export function getDepartmentSummaries(): DepartmentSummary[] {
  return DEPARTMENTS.map((department) => {
    const staffInDept = STAFF.filter((s) => s.department === department)
    const headCandidate =
      DOCTORS.find((d) => d.department === department) ?? staffInDept[0] ?? undefined
    return {
      department,
      staffCount: staffInDept.length,
      head: headCandidate?.name ?? "Unassigned",
      description: DEPARTMENT_DESCRIPTIONS[department],
      status: "Active",
    }
  })
}
