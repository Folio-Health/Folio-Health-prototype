import type { Metadata } from "next"
import { AdmissionsDashboard } from "@/features/analytics/components/admissions-dashboard"

export const metadata: Metadata = { title: "Admissions Analytics" }

export default function AnalyticsAdmissionsPage() {
  return <AdmissionsDashboard />
}
