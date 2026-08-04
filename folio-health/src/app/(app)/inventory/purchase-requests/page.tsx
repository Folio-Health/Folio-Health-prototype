import type { Metadata } from "next"
import { PurchaseRequestsList } from "@/features/inventory/components/purchase-requests-list"

export const metadata: Metadata = { title: "Purchase Requests" }

export default function InventoryPurchaseRequestsPage() {
  return <PurchaseRequestsList />
}
