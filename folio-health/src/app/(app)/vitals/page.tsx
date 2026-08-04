import type { Metadata } from "next"
import { VitalsHub } from "@/features/vitals/components/vitals-hub"

export const metadata: Metadata = { title: "Vitals" }

export default function VitalsPage() {
  return <VitalsHub />
}
