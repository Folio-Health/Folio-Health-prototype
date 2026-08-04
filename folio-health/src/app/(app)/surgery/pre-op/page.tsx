import type { Metadata } from "next"
import { PreOpChecklistPage } from "@/features/surgery/components/pre-op-checklist"

export const metadata: Metadata = { title: "Pre Op Checklist" }

export default function SurgeryPreOpPage() {
  return <PreOpChecklistPage />
}
