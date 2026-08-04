import type { Metadata } from "next"
import { ProfileSettings } from "@/features/settings/components/profile-settings"

export const metadata: Metadata = { title: "My Profile" }

export default function SettingsProfilePage() {
  return <ProfileSettings />
}
