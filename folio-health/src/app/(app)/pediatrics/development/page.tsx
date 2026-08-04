import type { Metadata } from "next"
import { DevelopmentTracking } from "@/features/pediatrics/components/development-tracking"

export const metadata: Metadata = { title: "Development Tracking" }

export default function PediatricsDevelopmentPage() {
  return <DevelopmentTracking />
}
