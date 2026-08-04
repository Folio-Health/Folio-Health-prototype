import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "@/lib/mock/seed"
import { PATIENTS } from "@/lib/mock/patients"
import type { Department } from "@/types/core"

// Reception module owns offset 6 (patients=2, staff=1, appointments=3, vitals=4,
// notifications=5 are already taken — see AGENT_PATTERNS.md).
seedFaker(6)

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

const DEPARTMENT_TOKEN_PREFIX: Record<string, string> = {
  "General Medicine": "A",
  Cardiology: "B",
  Pediatrics: "C",
  Orthopedics: "D",
  "Emergency Medicine": "E",
  "Obstetrics & Gynecology": "F",
}

function buildQueue(): QueueEntry[] {
  const entries: QueueEntry[] = []
  let counter = 1
  const patientPool = faker.helpers.arrayElements(PATIENTS, 60)
  let poolIndex = 0

  for (const department of QUEUE_DEPARTMENTS) {
    const prefix = DEPARTMENT_TOKEN_PREFIX[department]
    const count = faker.number.int({ min: 4, max: 9 })
    for (let i = 0; i < count; i++) {
      const patient = patientPool[poolIndex % patientPool.length]
      poolIndex++
      const status: QueueStatus =
        i === 0
          ? "Now Serving"
          : pick(["Waiting", "Waiting", "Waiting", "Completed"] as const)

      entries.push({
        id: id("QUE", counter),
        token: `${prefix}-${String(i + 1).padStart(3, "0")}`,
        department,
        patientId: patient.id,
        status,
        checkedInAt: faker.date.recent({ days: 0.3 }).toISOString(),
        estWaitMinutes: faker.number.int({ min: 2, max: 45 }),
      })
      counter++
    }
  }
  return entries
}

export const QUEUE_ENTRIES: QueueEntry[] = buildQueue()

export function getQueueGroupedByDepartment(entries: QueueEntry[] = QUEUE_ENTRIES) {
  const map = new Map<Department, QueueEntry[]>()
  for (const dept of QUEUE_DEPARTMENTS) map.set(dept, [])
  for (const entry of entries) {
    map.get(entry.department)?.push(entry)
  }
  return map
}
