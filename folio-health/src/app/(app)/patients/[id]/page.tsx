import type { Metadata } from "next"
import { PatientProfile } from "@/features/patients/components/patient-profile"

export const metadata: Metadata = { title: "Patient Profile" }

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PatientProfile patientId={id} />
}
