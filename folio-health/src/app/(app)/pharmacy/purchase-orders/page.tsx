import type { Metadata } from "next"
import { PurchaseOrdersList } from "@/features/pharmacy/components/purchase-orders-list"

export const metadata: Metadata = { title: "Purchase Orders" }

export default function PharmacyPurchaseOrdersPage() {
  return <PurchaseOrdersList />
}
