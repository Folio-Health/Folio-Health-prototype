import type { Department } from "@/types/core"

// Reception module owns offset 6 (patients=2, staff=1, appointments=3, vitals=4,
// notifications=5 are already taken — see AGENT_PATTERNS.md).

export type QueueStatus = "Waiting" | "Now Serving" | "Completed"

export interface QueueEntry {
  id: string
  token: string
  department: Department
  patientId: string
  status: QueueStatus
  checkedInAt: string
  estWaitMinutes: number
}

export const QUEUE_DEPARTMENTS: Department[] = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Orthopedics",
  "Emergency Medicine",
  "Obstetrics & Gynecology",
]


// Mock records removed: production shows real (empty) state. The queue has no
// real data model yet, so it is honestly empty until one exists.
export const QUEUE_ENTRIES: QueueEntry[] = []

export function getQueueGroupedByDepartment(entries: QueueEntry[] = QUEUE_ENTRIES) {
  const map = new Map<Department, QueueEntry[]>()
  for (const dept of QUEUE_DEPARTMENTS) map.set(dept, [])
  for (const entry of entries) {
    map.get(entry.department)?.push(entry)
  }
  return map
}
