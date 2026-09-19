// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
const NOW = new Date()

export const DRUG_CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Antihypertensives",
  "Antidiabetics",
  "Antivirals",
  "Vitamins & Supplements",
  "Antifungals",
  "Antihistamines",
  "Gastrointestinal",
  "Cardiovascular",
  "Respiratory",
] as const

export type DrugCategory = (typeof DRUG_CATEGORIES)[number]

export interface Drug {
  id: string
  name: string
  category: DrugCategory
  unit: string
  stockQty: number
  reorderLevel: number
  expiryDate: string
  price: number
  supplierId: string
  batchNo: string
}

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock"
export type InventoryStatus = StockStatus | "Expired" | "Expiring"

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  itemsSupplied: number
  status: "Active" | "Inactive"
}

export const SUPPLIERS: Supplier[] = []

export const DRUGS: Drug[] = []

export function getStockStatus(drug: Pick<Drug, "stockQty" | "reorderLevel">): StockStatus {
  if (drug.stockQty <= 0) return "Out of Stock"
  if (drug.stockQty <= drug.reorderLevel) return "Low Stock"
  return "In Stock"
}

export function isExpired(drug: Pick<Drug, "expiryDate">): boolean {
  return new Date(drug.expiryDate).getTime() < NOW.getTime()
}

export function isExpiringSoon(drug: Pick<Drug, "expiryDate">, withinDays = 45): boolean {
  const days = (new Date(drug.expiryDate).getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= withinDays
}

/** True if the drug expires between now and the end of the current calendar month. */
export function isExpiringThisMonth(drug: Pick<Drug, "expiryDate">): boolean {
  const expiry = new Date(drug.expiryDate)
  const endOfMonth = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0, 23, 59, 59)
  return expiry.getTime() >= NOW.getTime() && expiry.getTime() <= endOfMonth.getTime()
}

/** Combined status for the inventory table/StatusBadge — priority: out of stock > expired > low stock > expiring > in stock. */
export function getInventoryStatus(drug: Drug): InventoryStatus {
  if (drug.stockQty <= 0) return "Out of Stock"
  if (isExpired(drug)) return "Expired"
  if (drug.stockQty <= drug.reorderLevel) return "Low Stock"
  if (isExpiringSoon(drug)) return "Expiring"
  return "In Stock"
}

export function getDrugById(drugId: string): Drug | undefined {
  return DRUGS.find((d) => d.id === drugId)
}

export function getSupplierById(supplierId: string): Supplier | undefined {
  return SUPPLIERS.find((s) => s.id === supplierId)
}

export interface PrescriptionMedication {
  drugId: string
  drugName: string
  dosage: string
  quantity: number
}

export type PrescriptionStatus = "To Dispense" | "Dispensed" | "Cancelled"

export interface Prescription {
  id: string
  patientId: string
  medications: PrescriptionMedication[]
  prescribedByStaffId: string
  date: string
  status: PrescriptionStatus
}

export const PRESCRIPTIONS: Prescription[] = []

export function getPrescriptionById(rxId: string): Prescription | undefined {
  return PRESCRIPTIONS.find((p) => p.id === rxId)
}

export function isToday(dateIso: string): boolean {
  const d = new Date(dateIso)
  return (
    d.getFullYear() === NOW.getFullYear() &&
    d.getMonth() === NOW.getMonth() &&
    d.getDate() === NOW.getDate()
  )
}

export type PurchaseOrderStatus = "Draft" | "Pending" | "Approved" | "Delivered"

export interface PurchaseOrderItem {
  drugId: string
  drugName: string
  quantity: number
  unitPrice: number
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  items: PurchaseOrderItem[]
  totalAmount: number
  status: PurchaseOrderStatus
  date: string
}

export const PURCHASE_ORDERS: PurchaseOrder[] = []

export function getPurchaseOrderById(poId: string): PurchaseOrder | undefined {
  return PURCHASE_ORDERS.find((p) => p.id === poId)
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`
}
