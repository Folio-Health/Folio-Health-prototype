import type { Metadata } from "next"
import { RefundsList } from "@/features/billing/components/refunds-list"

export const metadata: Metadata = { title: "Refunds" }

export default function BillingRefundsPage() {
  return <RefundsList />
}
