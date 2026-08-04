import type { Metadata } from "next"
import { PortalAppointments } from "@/features/portal/components/portal-appointments"

export const metadata: Metadata = { title: "My Appointments" }

export default function PortalAppointmentsPage() {
  return <PortalAppointments />
}
