import type { Metadata } from "next"
import { PortalDownloads } from "@/features/portal/components/portal-downloads"

export const metadata: Metadata = { title: "Downloads" }

export default function PortalDownloadsPage() {
  return <PortalDownloads />
}
