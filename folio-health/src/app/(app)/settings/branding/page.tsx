import type { Metadata } from "next"
import { HospitalBrandingForm } from "@/features/settings/components/hospital-branding-form"

export const metadata: Metadata = { title: "Hospital Branding" }

export default function SettingsBrandingPage() {
  return <HospitalBrandingForm />
}
