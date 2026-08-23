// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Patient } from "@/types/core"

export const PATIENTS: Patient[] = []

export function getPatientById(patientId: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === patientId)
}

export function searchPatients(query: string): Patient[] {
  const q = query.trim().toLowerCase()
  if (!q) return PATIENTS
  return PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
  )
}
