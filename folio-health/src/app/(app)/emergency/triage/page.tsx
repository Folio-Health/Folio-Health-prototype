import type { Metadata } from "next"
import { TriageQueue } from "@/features/emergency/components/triage-queue"

export const metadata: Metadata = { title: "Triage Queue" }

export default function EmergencyTriagePage() {
  return <TriageQueue />
}
