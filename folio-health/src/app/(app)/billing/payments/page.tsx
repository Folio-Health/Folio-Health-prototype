import type { Metadata } from "next"
import { PaymentsList } from "@/features/billing/components/payments-list"

export const metadata: Metadata = { title: "Payments" }

export default function BillingPaymentsPage() {
  return <PaymentsList />
}
