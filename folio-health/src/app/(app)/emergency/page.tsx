import type { Metadata } from "next"
import { EmergencyDashboard } from "@/features/emergency/components/emergency-dashboard"

export const metadata: Metadata = { title: "Emergency Dashboard" }

export default function EmergencyPage() {
  return <EmergencyDashboard />
}
