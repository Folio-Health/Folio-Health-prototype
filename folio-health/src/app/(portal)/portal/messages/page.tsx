import type { Metadata } from "next"
import { PortalMessages } from "@/features/portal/components/portal-messages"

export const metadata: Metadata = { title: "Messages" }

export default function PortalMessagesPage() {
  return <PortalMessages />
}
