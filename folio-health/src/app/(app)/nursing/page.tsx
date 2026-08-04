import type { Metadata } from "next"
import { AssignedPatientsList } from "@/features/nursing/components/assigned-patients-list"

export const metadata: Metadata = { title: "Nursing" }

export default function NursingPage() {
  return <AssignedPatientsList />
}
