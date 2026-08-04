import type { Metadata } from "next"
import { ChatPanel } from "@/features/communication/components/chat-panel"

export const metadata: Metadata = { title: "Internal Chat" }

export default function CommunicationChatPage() {
  return <ChatPanel />
}
