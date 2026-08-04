import type { Metadata } from "next"
import { EquipmentList } from "@/features/inventory/components/equipment-list"

export const metadata: Metadata = { title: "Equipment Tracking" }

export default function InventoryEquipmentPage() {
  return <EquipmentList />
}
