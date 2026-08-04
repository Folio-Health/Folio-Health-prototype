import type { Metadata } from "next"
import { PortalDashboard } from "@/features/portal/components/portal-dashboard"

export const metadata: Metadata = { title: "My Dashboard" }

export default function PortalDashboardPage() {
  return <PortalDashboard />
}
