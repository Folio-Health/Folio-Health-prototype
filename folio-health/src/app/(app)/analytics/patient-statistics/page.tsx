import type { Metadata } from "next"
import { PatientStatisticsDashboard } from "@/features/analytics/components/patient-statistics-dashboard"

export const metadata: Metadata = { title: "Patient Statistics" }

export default function AnalyticsPatientStatisticsPage() {
  return <PatientStatisticsDashboard />
}
