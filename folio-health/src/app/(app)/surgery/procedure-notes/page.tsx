import type { Metadata } from "next"
import { ProcedureNotes } from "@/features/surgery/components/procedure-notes"

export const metadata: Metadata = { title: "Procedure Notes" }

export default function SurgeryProcedureNotesPage() {
  return <ProcedureNotes />
}
