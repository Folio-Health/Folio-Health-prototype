import type { Metadata } from "next"
import { AdmissionsHub } from "@/features/admissions/components/admissions-hub"

export const metadata: Metadata = { title: "Admissions" }

export default function AdmissionsPage() {
  return <AdmissionsHub />
}
