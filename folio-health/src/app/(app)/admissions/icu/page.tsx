import type { Metadata } from "next"
import { IcuDashboard } from "@/features/admissions/components/icu-dashboard"

export const metadata: Metadata = { title: "ICU Dashboard" }

export default function AdmissionsIcuPage() {
  return <IcuDashboard />
}
