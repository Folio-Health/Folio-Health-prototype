import type { Metadata } from "next"
import { EmergencyQueue } from "@/features/emergency/components/emergency-queue"

export const metadata: Metadata = { title: "Emergency Queue" }

export default function EmergencyQueuePage() {
  return <EmergencyQueue />
}
