import type { Metadata } from "next"
import { NotificationsPage } from "@/features/communication/components/notifications-page"

export const metadata: Metadata = { title: "Notifications" }

export default function CommunicationNotificationsPage() {
  return <NotificationsPage />
}
