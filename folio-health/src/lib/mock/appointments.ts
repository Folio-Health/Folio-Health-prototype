import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import type { Appointment, AppointmentStatus } from "@/types/core"
import { PATIENTS } from "./patients"
import { DOCTORS } from "./staff"

seedFaker(3)

const REASONS = [
  "Routine checkup",
  "Follow up consultation",
  "Persistent headache",
  "Fever and chills",
  "Annual physical exam",
  "Blood pressure review",
  "Diabetes management",
  "Skin rash",
  "Joint pain",
  "Prenatal checkup",
  "Vaccination",
  "Post surgical review",
  "Chest pain",
  "Abdominal pain",
]

const TYPES: Appointment["type"][] = [
  "New Visit",
  "Follow-up",
  "Consultation",
  "Procedure",
  "Telehealth",
]

function buildAppointments(count: number): Appointment[] {
  const appointments: Appointment[] = []

  for (let i = 1; i <= count; i++) {
    const patient = pick(PATIENTS)
    const doctor = pick(DOCTORS)
    const daysOffset = faker.number.int({ min: -14, max: 21 })
    const date = faker.date.soon({ days: 1, refDate: new Date() })
    date.setDate(date.getDate() + daysOffset)
    const hour = faker.number.int({ min: 8, max: 17 })
    const minute = pick([0, 15, 30, 45])
    date.setHours(hour, minute, 0, 0)
    const end = new Date(date.getTime() + 30 * 60000)

    const isPast = date.getTime() < Date.now()
    const status: AppointmentStatus = isPast
      ? pick([
          "Completed",
          "Completed",
          "Completed",
          "Cancelled",
          "No Show",
        ] as const)
      : pick(["Scheduled", "Scheduled", "Checked In"] as const)

    appointments.push({
      id: id("APT", i),
      patientId: patient.id,
      doctorId: doctor.id,
      department: doctor.department,
      date: date.toISOString().slice(0, 10),
      startTime: date.toISOString(),
      endTime: end.toISOString(),
      type: pick(TYPES),
      status,
      reason: pick(REASONS),
    })
  }

  return appointments.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export const APPOINTMENTS: Appointment[] = buildAppointments(220)

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
