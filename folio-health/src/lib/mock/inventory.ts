// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Department } from "@/types/core"

/* ------------------------------------------------------------------ */
/* Medical Supplies                                                     */
/* ------------------------------------------------------------------ */

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock"

export interface SupplyItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  reorderLevel: number
  unitCost: number
}

export const SUPPLY_CATEGORIES = [
  "PPE & Protective Wear",
  "Wound Care",
  "IV & Infusion",
  "Diagnostic Consumables",
  "Surgical Consumables",
  "General Ward Supplies",
  "Sterilization",
  "Respiratory",
] as const

export const SUPPLY_ITEMS: SupplyItem[] = []

export function getSupplyStatus(item: Pick<SupplyItem, "quantity" | "reorderLevel">): StockStatus {
  if (item.quantity <= 0) return "Out of Stock"
  if (item.quantity <= item.reorderLevel) return "Low Stock"
  return "In Stock"
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`
}

/* ------------------------------------------------------------------ */
/* Equipment Tracking                                                   */
/* ------------------------------------------------------------------ */

export type EquipmentStatus = "Operational" | "Under Maintenance" | "Out of Service"

export interface Equipment {
  id: string
  name: string
  category: string
  serialNumber: string
  department: Department
  status: EquipmentStatus
  lastServicedDate: string
}

export const EQUIPMENT: Equipment[] = []

/* ------------------------------------------------------------------ */
/* Warehouse / Storage Locations                                        */
/* ------------------------------------------------------------------ */

export interface WarehouseZone {
  id: string
  name: string
  location: string
  itemCount: number
  capacity: number
  temperatureControlled: boolean
}

export const WAREHOUSE_ZONES: WarehouseZone[] = []

/* ------------------------------------------------------------------ */
/* Purchase Requests                                                    */
/* ------------------------------------------------------------------ */

export type PurchaseRequestStatus = "Pending" | "Approved" | "Rejected" | "Fulfilled"

export interface PurchaseRequestItem {
  itemName: string
  quantity: number
}

export interface PurchaseRequest {
  id: string
  requestedByStaffId: string
  department: Department
  items: PurchaseRequestItem[]
  status: PurchaseRequestStatus
  date: string
}

export const PURCHASE_REQUESTS: PurchaseRequest[] = []

/* ------------------------------------------------------------------ */
/* Stock Movement Log                                                   */
/* ------------------------------------------------------------------ */

export type MovementType = "In" | "Out" | "Transfer" | "Adjustment"

export interface StockMovement {
  id: string
  itemName: string
  movementType: MovementType
  quantity: number
  fromLocation: string
  toLocation: string
  date: string
  recordedByStaffId: string
}

export const STOCK_MOVEMENTS: StockMovement[] = []
