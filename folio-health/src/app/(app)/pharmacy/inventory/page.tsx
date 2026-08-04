import type { Metadata } from "next"
import { InventoryList } from "@/features/pharmacy/components/inventory-list"

export const metadata: Metadata = { title: "Drug Inventory" }

export default function PharmacyInventoryPage() {
  return <InventoryList />
}
