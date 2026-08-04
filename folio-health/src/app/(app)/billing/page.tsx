import type { Metadata } from "next"
import { InvoicesList } from "@/features/billing/components/invoices-list"

export const metadata: Metadata = { title: "Billing" }

export default function BillingPage() {
  return <InvoicesList />
}
