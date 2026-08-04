import type { Metadata } from "next"
import { DischargeQueue } from "@/features/admissions/components/discharge-queue"

export const metadata: Metadata = { title: "Discharge Queue" }

export default function AdmissionsDischargePage() {
  return <DischargeQueue />
}
