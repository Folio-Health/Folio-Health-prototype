import type { Metadata } from "next"
import { ClinicalReportsDashboard } from "@/features/analytics/components/clinical-reports-dashboard"

export const metadata: Metadata = { title: "Clinical Reports" }

export default function AnalyticsClinicalReportsPage() {
  return <ClinicalReportsDashboard />
}
