import { faker } from "@faker-js/faker"
import { PATIENTS } from "@/lib/mock/patients"
import { APPOINTMENTS, getTodaysAppointments } from "@/lib/mock/appointments"
import { STAFF, DOCTORS } from "@/lib/mock/staff"
import { NOTIFICATIONS } from "@/lib/mock/notifications"

faker.seed(90001)

export function getAdminKpis() {
  const today = getTodaysAppointments()
  return {
    todaysPatients: 128,
    todaysPatientsDelta: 12,
    appointments: today.length || 86,
    appointmentsDelta: 8,
    admissions: 24,
    admissionsDelta: -4,
    discharges: 18,
    dischargesDelta: 6,
    emergencyCases: 6,
    emergencyDelta: 5,
    pendingLabTests: 45,
    pendingLabDelta: -3,
  }
}

export function getWeeklyPatientVisits() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map((day) => ({
    day,
    visits: faker.number.int({ min: 60, max: 165 }),
  }))
}

export function getDepartmentLoad() {
  return [
    { label: "Outpatient", value: 46 },
    { label: "Inpatient", value: 23 },
    { label: "Emergency", value: 15 },
    { label: "Surgery", value: 10 },
    { label: "Others", value: 6 },
  ]
}

export function getRecentActivity() {
  return [
    {
      id: 1,
      title: "New patient John Doe registered",
      time: "6 mins ago",
      by: "Dr. Sarah Smith",
    },
    {
      id: 2,
      title: "Lab result ready for Sarah Johnson",
      time: "22 mins ago",
      by: "Dr. James Allen",
    },
    {
      id: 3,
      title: "Appointment scheduled with Dr. Smith",
      time: "1 hour ago",
      by: "Reception",
    },
    {
      id: 4,
      title: "Patient Michael Brown admitted",
      time: "2 hours ago",
      by: "Dr. James Allen",
    },
  ]
}

export function getEmergencyAlerts() {
  return [
    { id: 1, title: "ICU Bed 2 now available", time: "6 mins ago", severity: "info" as const },
    {
      id: 2,
      title: "Critical lab result for Patient PT-1245",
      time: "15 mins ago",
      severity: "critical" as const,
    },
    { id: 3, title: "Blood Bank O- level low", time: "28 mins ago", severity: "warning" as const },
  ]
}

export function getUpcomingAppointmentsPreview() {
  return getTodaysAppointments()
    .slice(0, 5)
    .map((apt) => {
      const patient = PATIENTS.find((p) => p.id === apt.patientId)
      const doctor = STAFF.find((s) => s.id === apt.doctorId)
      return { ...apt, patient, doctor }
    })
    .filter((a) => a.patient && a.doctor)
}

export function getDoctorKpis(doctorId: string) {
  const myAppointments = APPOINTMENTS.filter((a) => a.doctorId === doctorId)
  const today = myAppointments.filter((a) => a.date === new Date().toISOString().slice(0, 10))
  return {
    todaysAppointments: today.length || 12,
    completedToday: today.filter((a) => a.status === "Completed").length || 5,
    pendingReviews: faker.number.int({ min: 3, max: 9 }),
    avgConsultTime: 18,
  }
}

export function getRandomDoctor() {
  return DOCTORS[0]
}

export function getUnreadNotifications() {
  return NOTIFICATIONS.filter((n) => !n.read)
}
