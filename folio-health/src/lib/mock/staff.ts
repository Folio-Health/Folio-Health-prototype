// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { ClinicalRole, StaffMember } from "@/types/core"

export const STAFF: StaffMember[] = []

export const DOCTORS = STAFF.filter((s) => s.role === "Doctor")
export const NURSES = STAFF.filter((s) => s.role === "Nurse")

export function getStaffById(staffId: string): StaffMember | undefined {
  return STAFF.find((s) => s.id === staffId)
}

export function getStaffByRole(role: ClinicalRole): StaffMember[] {
  return STAFF.filter((s) => s.role === role)
}
