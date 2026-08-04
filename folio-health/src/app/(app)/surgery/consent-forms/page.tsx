import type { Metadata } from "next"
import { ConsentForms } from "@/features/surgery/components/consent-forms"

export const metadata: Metadata = { title: "Consent Forms" }

export default function SurgeryConsentFormsPage() {
  return <ConsentForms />
}
