import type { Metadata } from "next"
import { AssistantWorkspace } from "@/features/assistant/components/assistant-workspace"

export const metadata: Metadata = { title: "AI Assistant" }

export default function AssistantPage() {
  return <AssistantWorkspace />
}
