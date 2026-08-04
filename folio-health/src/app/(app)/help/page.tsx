import type { Metadata } from "next"
import { HelpCenter } from "@/features/help/components/help-center"

export const metadata: Metadata = { title: "Help Center" }

export default function HelpCenterPage() {
  return <HelpCenter />
}
