import type { Metadata } from "next"
import { AppointmentQueue } from "@/features/appointments/components/appointment-queue"

export const metadata: Metadata = { title: "Appointment Queue" }

export default function Page() {
  return <AppointmentQueue />
}
