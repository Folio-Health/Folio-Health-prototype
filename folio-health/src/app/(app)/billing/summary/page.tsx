import type { Metadata } from "next"
import { BillingSummary } from "@/features/billing/components/billing-summary"

export const metadata: Metadata = { title: "Financial Summary" }

export default function BillingSummaryPage() {
  return <BillingSummary />
}
