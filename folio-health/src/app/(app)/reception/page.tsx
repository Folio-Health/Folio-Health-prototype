import type { Metadata } from "next"
import { ReceptionDashboard } from "@/features/reception/components/reception-dashboard"

export const metadata: Metadata = { title: "Reception" }

export default function ReceptionPage() {
  return <ReceptionDashboard />
}
