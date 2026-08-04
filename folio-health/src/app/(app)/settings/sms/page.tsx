import type { Metadata } from "next"
import { SmsConfigurationForm } from "@/features/settings/components/sms-configuration-form"

export const metadata: Metadata = { title: "SMS Configuration" }

export default function SettingsSmsPage() {
  return <SmsConfigurationForm />
}
