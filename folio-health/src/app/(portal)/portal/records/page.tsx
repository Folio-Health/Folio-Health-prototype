import type { Metadata } from "next"
import { PortalRecords } from "@/features/portal/components/portal-records"

export const metadata: Metadata = { title: "Medical Records" }

export default function PortalRecordsPage() {
  return <PortalRecords />
}
