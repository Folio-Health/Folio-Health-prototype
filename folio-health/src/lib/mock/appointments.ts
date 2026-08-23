// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Appointment } from "@/types/core"

export const APPOINTMENTS: Appointment[] = []

export function getAppointmentsForPatient(patientId: string) {
  return APPOINTMENTS.filter((a) => a.patientId === patientId)
}

export function getAppointmentsForDoctor(doctorId: string) {
  return APPOINTMENTS.filter((a) => a.doctorId === doctorId)
}

export function getTodaysAppointments() {
  const today = new Date().toISOString().slice(0, 10)
  return APPOINTMENTS.filter((a) => a.date === today)
}
