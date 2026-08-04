import type { Metadata } from "next"
import { StockMovementLog } from "@/features/inventory/components/stock-movement-log"

export const metadata: Metadata = { title: "Stock Movement" }

export default function InventoryStockMovementPage() {
  return <StockMovementLog />
}
