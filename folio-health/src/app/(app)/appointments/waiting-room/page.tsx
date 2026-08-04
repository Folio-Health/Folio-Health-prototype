import type { Metadata } from "next"
import { WaitingRoomBoard } from "@/features/appointments/components/waiting-room-board"

export const metadata: Metadata = { title: "Waiting Room" }

export default function Page() {
  return <WaitingRoomBoard />
}
