import type { Metadata } from "next"
import { SurgerySchedule } from "@/features/surgery/components/surgery-schedule"

export const metadata: Metadata = { title: "Surgery Schedule" }

export default function SurgeryPage() {
  return <SurgerySchedule />
}
