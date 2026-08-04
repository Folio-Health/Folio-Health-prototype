import type { Metadata } from "next"
import { ClaimsList } from "@/features/billing/components/claims-list"

export const metadata: Metadata = { title: "Insurance Claims" }

export default function BillingClaimsPage() {
  return <ClaimsList />
}
