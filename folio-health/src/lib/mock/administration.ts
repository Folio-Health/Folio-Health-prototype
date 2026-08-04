import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { STAFF } from "./staff"
import { PATIENTS } from "./patients"

seedFaker(51)

/* ------------------------------------------------------------------ */
/* Audit logs                                                          */
/* ------------------------------------------------------------------ */

export type AuditAction = "Created" | "Updated" | "Deleted" | "Login" | "Logout"
export type AuditStatus = "Success" | "Failed"

export interface AuditLogEntry {
  id: string
  timestamp: string
  staffId: string
  action: AuditAction
  entity: string
  ipAddress: string
  status: AuditStatus
}

const AUDIT_ACTIONS: AuditAction[] = ["Created", "Updated", "Deleted", "Login", "Logout"]

const AUDIT_ENTITY_TEMPLATES: (() => string)[] = [
  () => `Patient ${pick(PATIENTS).mrn}`,
  () => `Appointment APT-${faker.number.int({ min: 1000, max: 9999 })}`,
  () => `Invoice INV-${faker.number.int({ min: 1000, max: 9999 })}`,
  () => `Prescription RX-${faker.number.int({ min: 1000, max: 9999 })}`,
  () => `Staff Record ${pick(STAFF).staffId}`,
  () => `Lab Order LAB-${faker.number.int({ min: 1000, max: 9999 })}`,
  () => `User Session`,
  () => `System Setting`,
]

function buildAuditLogs(count: number): AuditLogEntry[] {
  const logs: AuditLogEntry[] = []
  for (let i = 1; i <= count; i++) {
    const staff = pick(STAFF)
    const action = pick(AUDIT_ACTIONS)
    const entity = action === "Login" || action === "Logout" ? "User Session" : pick(AUDIT_ENTITY_TEMPLATES)()
    const status: AuditStatus = faker.number.float({ min: 0, max: 1 }) > 0.92 ? "Failed" : "Success"

    logs.push({
      id: id("AUD", i),
      timestamp: faker.date.recent({ days: 21 }).toISOString(),
      staffId: staff.id,
      action,
      entity,
      ipAddress: faker.internet.ipv4(),
      status,
    })
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const AUDIT_LOGS: AuditLogEntry[] = buildAuditLogs(40)

/* ------------------------------------------------------------------ */
/* Activity logs                                                       */
/* ------------------------------------------------------------------ */

export interface ActivityLogEntry {
  id: string
  timestamp: string
  staffId: string
  activity: string
  module: string
}

const ACTIVITY_TEMPLATES: { activity: (() => string); module: string }[] = [
  { activity: () => `Viewed patient record ${pick(PATIENTS).mrn}`, module: "Patients" },
  { activity: () => "Exported billing report", module: "Billing" },
  { activity: () => "Updated appointment schedule", module: "Appointments" },
  { activity: () => "Reviewed lab results", module: "Laboratory" },
  { activity: () => "Dispensed medication", module: "Pharmacy" },
  { activity: () => "Printed discharge summary", module: "Admissions" },
  { activity: () => "Generated analytics dashboard", module: "Analytics" },
  { activity: () => "Updated staff shift schedule", module: "HR" },
  { activity: () => "Reviewed radiology imaging report", module: "Radiology" },
  { activity: () => "Searched patient directory", module: "Patients" },
  { activity: () => "Downloaded invoice PDF", module: "Billing" },
  { activity: () => "Updated inventory stock count", module: "Inventory" },
  { activity: () => "Sent appointment reminder", module: "Communication" },
  { activity: () => "Logged into the system", module: "Authentication" },
]

function buildActivityLogs(count: number): ActivityLogEntry[] {
  const logs: ActivityLogEntry[] = []
  for (let i = 1; i <= count; i++) {
    const staff = pick(STAFF)
    const template = pick(ACTIVITY_TEMPLATES)

    logs.push({
      id: id("ACT", i),
      timestamp: faker.date.recent({ days: 14 }).toISOString(),
      staffId: staff.id,
      activity: template.activity(),
      module: template.module,
    })
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const ACTIVITY_LOGS: ActivityLogEntry[] = buildActivityLogs(30)

/* ------------------------------------------------------------------ */
/* System users (last active)                                          */
/* ------------------------------------------------------------------ */

export const LAST_ACTIVE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const staff of STAFF) {
    map[staff.id] = faker.date.recent({ days: 30 }).toISOString()
  }
  return map
})()
