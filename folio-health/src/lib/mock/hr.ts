import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { STAFF, DOCTORS } from "./staff"
import type { Department } from "@/types/core"
import { DEPARTMENTS } from "@/types/core"

seedFaker(50)

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

function randomTime(startHour: number, endHour: number) {
  const hour = faker.number.int({ min: startHour, max: endHour })
  const minute = faker.number.int({ min: 0, max: 59 })
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`
}

function buildAttendance(count: number): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  for (let i = 1; i <= count; i++) {
    const staff = pick(STAFF)
    const date = faker.date.recent({ days: 14 })
    const roll = faker.number.float({ min: 0, max: 1 })
    const status: AttendanceStatus = roll > 0.9 ? "Absent" : roll > 0.78 ? "Late" : "Present"

    let clockIn: string | null = null
    let clockOut: string | null = null
    let hoursWorked = 0

    if (status !== "Absent") {
      clockIn = status === "Late" ? randomTime(9, 11) : randomTime(7, 9)
      clockOut = randomTime(16, 19)
      hoursWorked = faker.number.float({ min: status === "Late" ? 5.5 : 7.5, max: 9.5, fractionDigits: 1 })
    }

    records.push({
      id: id("ATT", i),
      staffId: staff.id,
      date: date.toISOString(),
      clockIn,
      clockOut,
      hoursWorked,
      status,
    })
  }
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const ATTENDANCE_RECORDS: AttendanceRecord[] = buildAttendance(30)

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

const LEAVE_TYPES: LeaveType[] = ["Annual", "Sick", "Maternity", "Emergency"]
const LEAVE_REASONS: Record<LeaveType, string[]> = {
  Annual: ["Family vacation", "Personal travel", "Annual rest period", "Wedding attendance"],
  Sick: ["Recovering from illness", "Medical procedure recovery", "Doctor recommended rest"],
  Maternity: ["Maternity leave", "Antenatal care and delivery"],
  Emergency: ["Family emergency", "Bereavement", "Urgent personal matter"],
}

function buildLeaveRequests(count: number): LeaveRequest[] {
  const requests: LeaveRequest[] = []
  for (let i = 1; i <= count; i++) {
    const staff = pick(STAFF)
    const leaveType = pick(LEAVE_TYPES)
    const days =
      leaveType === "Maternity"
        ? faker.number.int({ min: 30, max: 84 })
        : leaveType === "Annual"
          ? faker.number.int({ min: 3, max: 14 })
          : faker.number.int({ min: 1, max: 5 })
    const from = faker.date.soon({ days: 45 })
    const to = new Date(from)
    to.setDate(to.getDate() + days)
    const roll = faker.number.float({ min: 0, max: 1 })
    const status: LeaveStatus = roll > 0.7 ? "Approved" : roll > 0.45 ? "Pending" : "Rejected"

    requests.push({
      id: id("LV", i),
      staffId: staff.id,
      leaveType,
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      status,
      requestedAt: faker.date.recent({ days: 20 }).toISOString(),
      reason: pick(LEAVE_REASONS[leaveType]),
    })
  }
  return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
}

export const LEAVE_REQUESTS: LeaveRequest[] = buildLeaveRequests(15)

/* ------------------------------------------------------------------ */
/* Shift planner                                                       */
/* ------------------------------------------------------------------ */

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
export type WeekDay = (typeof WEEK_DAYS)[number]
export type ShiftValue = "Morning" | "Evening" | "Night" | "Off"

const SHIFT_VALUES: ShiftValue[] = ["Morning", "Evening", "Night"]

function buildWeeklyShifts(): Record<string, Record<WeekDay, ShiftValue>> {
  const grid: Record<string, Record<WeekDay, ShiftValue>> = {}
  for (const staff of STAFF) {
    const week = {} as Record<WeekDay, ShiftValue>
    for (const day of WEEK_DAYS) {
      const roll = faker.number.float({ min: 0, max: 1 })
      if ((day === "Sat" || day === "Sun") && roll > 0.45) {
        week[day] = "Off"
      } else if (roll > 0.85) {
        week[day] = "Off"
      } else if (roll > 0.65) {
        week[day] = pick(SHIFT_VALUES)
      } else {
        week[day] = staff.shift
      }
    }
    grid[staff.id] = week
  }
  return grid
}

export const WEEKLY_SHIFTS: Record<string, Record<WeekDay, ShiftValue>> = buildWeeklyShifts()

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
