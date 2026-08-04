import type { Metadata } from "next"
import { LocalizationSettings } from "@/features/settings/components/localization-settings"

export const metadata: Metadata = { title: "Localization" }

export default function SettingsLocalizationPage() {
  return <LocalizationSettings />
}
