import type { Metadata } from "next"
import { ObstetricsOverview } from "@/features/obstetrics/components/obstetrics-overview"

export const metadata: Metadata = { title: "Obstetrics" }

export default function ObstetricsPage() {
  return <ObstetricsOverview />
}
