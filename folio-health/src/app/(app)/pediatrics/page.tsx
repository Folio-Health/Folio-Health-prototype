import type { Metadata } from "next"
import { PediatricsOverview } from "@/features/pediatrics/components/pediatrics-overview"

export const metadata: Metadata = { title: "Pediatrics" }

export default function PediatricsPage() {
  return <PediatricsOverview />
}
