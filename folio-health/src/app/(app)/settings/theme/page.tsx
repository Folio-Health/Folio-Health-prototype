import type { Metadata } from "next"
import { ThemeSettings } from "@/features/settings/components/theme-settings"

export const metadata: Metadata = { title: "Theme" }

export default function SettingsThemePage() {
  return <ThemeSettings />
}
