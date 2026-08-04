import type { Metadata } from "next"
import { ConsultationHub } from "@/features/consultation/components/consultation-hub"

export const metadata: Metadata = { title: "Consultation" }

export default function ConsultationPage() {
  return <ConsultationHub />
}
