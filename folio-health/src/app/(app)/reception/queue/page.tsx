import type { Metadata } from "next"
import { QueueBoard } from "@/features/reception/components/queue-board"

export const metadata: Metadata = { title: "Queue Management" }

export default function QueuePage() {
  return <QueueBoard />
}
