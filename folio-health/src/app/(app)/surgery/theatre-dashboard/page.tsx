import type { Metadata } from "next"
import { TheatreDashboard } from "@/features/surgery/components/theatre-dashboard"

export const metadata: Metadata = { title: "Theatre Dashboard" }

export default function SurgeryTheatreDashboardPage() {
  return <TheatreDashboard />
}
