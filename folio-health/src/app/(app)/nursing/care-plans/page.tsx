import type { Metadata } from "next"
import { CarePlans } from "@/features/nursing/components/care-plans"

export const metadata: Metadata = { title: "Care Plans" }

export default function NursingCarePlansPage() {
  return <CarePlans />
}
