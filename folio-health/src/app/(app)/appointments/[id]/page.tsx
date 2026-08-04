import type { Metadata } from "next"
import { AppointmentDetail } from "@/features/appointments/components/appointment-detail"

export const metadata: Metadata = { title: "Appointment Detail" }

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AppointmentDetail appointmentId={id} />
}
