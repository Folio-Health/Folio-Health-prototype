import type { Metadata } from "next"
import { HospitalSettingsForm } from "@/features/administration/components/hospital-settings-form"

export const metadata: Metadata = { title: "Hospital Settings" }

export default function AdministrationHospitalSettingsPage() {
  return <HospitalSettingsForm />
}
