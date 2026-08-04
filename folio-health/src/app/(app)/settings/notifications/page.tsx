import type { Metadata } from "next"
import { NotificationPreferences } from "@/features/settings/components/notification-preferences"

export const metadata: Metadata = { title: "Notification Preferences" }

export default function SettingsNotificationsPage() {
  return <NotificationPreferences />
}
