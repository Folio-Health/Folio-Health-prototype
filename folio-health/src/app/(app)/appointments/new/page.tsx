import type { Metadata } from "next"
import { NewAppointmentPage } from "@/features/appointments/components/new-appointment-page"

export const metadata: Metadata = { title: "New Appointment" }

export default function Page() {
  return <NewAppointmentPage />
}
