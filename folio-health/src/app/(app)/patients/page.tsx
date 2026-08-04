import type { Metadata } from "next"
import { PatientsList } from "@/features/patients/components/patients-list"

export const metadata: Metadata = { title: "Patients" }

export default function PatientsPage() {
  return <PatientsList />
}
