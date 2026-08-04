import type { Metadata } from "next"
import { FinancialReportsDashboard } from "@/features/analytics/components/financial-reports-dashboard"

export const metadata: Metadata = { title: "Financial Reports" }

export default function AnalyticsFinancialReportsPage() {
  return <FinancialReportsDashboard />
}
