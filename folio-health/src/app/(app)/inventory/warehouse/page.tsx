import type { Metadata } from "next"
import { WarehouseView } from "@/features/inventory/components/warehouse-view"

export const metadata: Metadata = { title: "Warehouse" }

export default function InventoryWarehousePage() {
  return <WarehouseView />
}
