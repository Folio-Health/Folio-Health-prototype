import { redirect } from "next/navigation"

/**
 * Profile is the one settings page every plane has. Branding is facility-only,
 * so landing there would dead-end a platform account that owns no facility.
 */
export default function SettingsRootPage() {
  redirect("/settings/profile")
}
