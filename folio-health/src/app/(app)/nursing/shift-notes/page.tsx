import type { Metadata } from "next"
import { ShiftNotes } from "@/features/nursing/components/shift-notes"

export const metadata: Metadata = { title: "Shift Handover Notes" }

export default function NursingShiftNotesPage() {
  return <ShiftNotes />
}
