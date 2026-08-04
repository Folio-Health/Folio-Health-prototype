import type { Metadata } from "next"
import { SuppliesList } from "@/features/inventory/components/supplies-list"

export const metadata: Metadata = { title: "Inventory" }

export default function InventoryPage() {
  return <SuppliesList />
}
