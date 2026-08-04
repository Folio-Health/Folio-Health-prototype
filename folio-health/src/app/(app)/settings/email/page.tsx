import type { Metadata } from "next"
import { EmailConfigurationForm } from "@/features/settings/components/email-configuration-form"

export const metadata: Metadata = { title: "Email Configuration" }

export default function SettingsEmailPage() {
  return <EmailConfigurationForm />
}
