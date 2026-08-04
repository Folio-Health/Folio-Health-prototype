import type { Metadata } from "next"
import { PortalBills } from "@/features/portal/components/portal-bills"

export const metadata: Metadata = { title: "My Bills" }

export default function PortalBillsPage() {
  return <PortalBills />
}
