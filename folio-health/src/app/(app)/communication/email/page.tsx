import type { Metadata } from "next"
import { EmailCenter } from "@/features/communication/components/email-center"

export const metadata: Metadata = { title: "Email Center" }

export default function CommunicationEmailPage() {
  return <EmailCenter />
}
