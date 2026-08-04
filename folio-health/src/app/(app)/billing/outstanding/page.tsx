import type { Metadata } from "next"
import { OutstandingList } from "@/features/billing/components/outstanding-list"

export const metadata: Metadata = { title: "Outstanding Bills" }

export default function BillingOutstandingPage() {
  return <OutstandingList />
}
