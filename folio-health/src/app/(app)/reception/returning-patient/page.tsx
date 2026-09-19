import type { Metadata } from "next"
import { ReturningPatientSearch } from "@/features/reception/components/returning-patient-search"

export const metadata: Metadata = { title: "Returning Patient" }

export default function ReturningPatientPage() {
  return <ReturningPatientSearch />
}
