import type { Metadata } from "next"
import { DiseaseTrendsDashboard } from "@/features/analytics/components/disease-trends-dashboard"

export const metadata: Metadata = { title: "Disease Trends" }

export default function AnalyticsDiseaseTrendsPage() {
  return <DiseaseTrendsDashboard />
}
