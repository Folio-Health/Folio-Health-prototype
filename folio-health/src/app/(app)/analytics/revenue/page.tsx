import type { Metadata } from "next"
import { RevenueDashboard } from "@/features/analytics/components/revenue-dashboard"

export const metadata: Metadata = { title: "Revenue Dashboard" }

export default function AnalyticsRevenuePage() {
  return <RevenueDashboard />
}
