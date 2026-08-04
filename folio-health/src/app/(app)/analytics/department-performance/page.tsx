import type { Metadata } from "next"
import { DepartmentPerformanceDashboard } from "@/features/analytics/components/department-performance-dashboard"

export const metadata: Metadata = { title: "Department Performance" }

export default function AnalyticsDepartmentPerformancePage() {
  return <DepartmentPerformanceDashboard />
}
