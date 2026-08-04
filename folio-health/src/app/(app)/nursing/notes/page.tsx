import type { Metadata } from "next"
import { NursingNotes } from "@/features/nursing/components/nursing-notes"

export const metadata: Metadata = { title: "Nursing Notes" }

export default function NursingNotesPage() {
  return <NursingNotes />
}
