import type { Metadata } from "next"
import { AnnouncementsList } from "@/features/communication/components/announcements-list"

export const metadata: Metadata = { title: "Announcements" }

export default function CommunicationAnnouncementsPage() {
  return <AnnouncementsList />
}
