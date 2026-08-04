import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { PATIENTS } from "./patients"
import { DOCTORS } from "./staff"

seedFaker(20)

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

const DRUG_CATALOG: { name: string; category: DrugCategory; unit: string }[] = [
  { name: "Amoxicillin 500mg", category: "Antibiotics", unit: "capsules" },
  { name: "Azithromycin 250mg", category: "Antibiotics", unit: "tablets" },
  { name: "Ciprofloxacin 500mg", category: "Antibiotics", unit: "tablets" },
  { name: "Doxycycline 100mg", category: "Antibiotics", unit: "capsules" },
  { name: "Metronidazole 400mg", category: "Antibiotics", unit: "tablets" },
  { name: "Cefuroxime 500mg", category: "Antibiotics", unit: "tablets" },
  { name: "Paracetamol 500mg", category: "Analgesics", unit: "tablets" },
  { name: "Ibuprofen 400mg", category: "Analgesics", unit: "tablets" },
  { name: "Diclofenac 50mg", category: "Analgesics", unit: "tablets" },
  { name: "Tramadol 50mg", category: "Analgesics", unit: "capsules" },
  { name: "Aspirin 300mg", category: "Analgesics", unit: "tablets" },
  { name: "Amlodipine 5mg", category: "Antihypertensives", unit: "tablets" },
  { name: "Lisinopril 10mg", category: "Antihypertensives", unit: "tablets" },
  { name: "Losartan 50mg", category: "Antihypertensives", unit: "tablets" },
  { name: "Atenolol 50mg", category: "Antihypertensives", unit: "tablets" },
  { name: "Hydrochlorothiazide 25mg", category: "Antihypertensives", unit: "tablets" },
  { name: "Metformin 500mg", category: "Antidiabetics", unit: "tablets" },
  { name: "Glibenclamide 5mg", category: "Antidiabetics", unit: "tablets" },
  { name: "Insulin Glargine", category: "Antidiabetics", unit: "vials" },
  { name: "Gliclazide 80mg", category: "Antidiabetics", unit: "tablets" },
  { name: "Sitagliptin 100mg", category: "Antidiabetics", unit: "tablets" },
  { name: "Acyclovir 400mg", category: "Antivirals", unit: "tablets" },
  { name: "Oseltamivir 75mg", category: "Antivirals", unit: "capsules" },
  { name: "Lamivudine 150mg", category: "Antivirals", unit: "tablets" },
  { name: "Efavirenz 600mg", category: "Antivirals", unit: "tablets" },
  { name: "Vitamin C 500mg", category: "Vitamins & Supplements", unit: "tablets" },
  { name: "Vitamin D3 1000IU", category: "Vitamins & Supplements", unit: "capsules" },
  { name: "Folic Acid 5mg", category: "Vitamins & Supplements", unit: "tablets" },
  { name: "Multivitamin Complex", category: "Vitamins & Supplements", unit: "tablets" },
  { name: "Zinc Sulphate 20mg", category: "Vitamins & Supplements", unit: "tablets" },
  { name: "Ferrous Sulphate 200mg", category: "Vitamins & Supplements", unit: "tablets" },
  { name: "Fluconazole 150mg", category: "Antifungals", unit: "capsules" },
  { name: "Ketoconazole 200mg", category: "Antifungals", unit: "tablets" },
  { name: "Clotrimazole Cream 1%", category: "Antifungals", unit: "tubes" },
  { name: "Cetirizine 10mg", category: "Antihistamines", unit: "tablets" },
  { name: "Loratadine 10mg", category: "Antihistamines", unit: "tablets" },
  { name: "Chlorpheniramine 4mg", category: "Antihistamines", unit: "tablets" },
  { name: "Omeprazole 20mg", category: "Gastrointestinal", unit: "capsules" },
  { name: "Ranitidine 150mg", category: "Gastrointestinal", unit: "tablets" },
  { name: "Loperamide 2mg", category: "Gastrointestinal", unit: "capsules" },
  { name: "ORS Sachets", category: "Gastrointestinal", unit: "sachets" },
  { name: "Atorvastatin 20mg", category: "Cardiovascular", unit: "tablets" },
  { name: "Simvastatin 20mg", category: "Cardiovascular", unit: "tablets" },
  { name: "Warfarin 5mg", category: "Cardiovascular", unit: "tablets" },
  { name: "Clopidogrel 75mg", category: "Cardiovascular", unit: "tablets" },
  { name: "Salbutamol Inhaler", category: "Respiratory", unit: "inhalers" },
  { name: "Prednisolone 5mg", category: "Respiratory", unit: "tablets" },
  { name: "Montelukast 10mg", category: "Respiratory", unit: "tablets" },
]

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

const SUPPLIER_NAMES = [
  "MedPlus Distributors",
  "PharmaCare Supplies Ltd",
  "Global Health Logistics",
  "Apex Pharmaceuticals",
  "National Drug Distributors",
  "MediSource Nigeria",
  "CarePoint Wholesale",
  "Vitalis Pharma Supply",
  "Zenith Medical Imports",
  "Everwell Pharma Group",
]

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  itemsSupplied: number
  status: "Active" | "Inactive"
}

function buildSuppliers(): Supplier[] {
  return SUPPLIER_NAMES.map((name, i) => ({
    id: id("SUP", i + 1),
    name,
    contact: faker.person.fullName(),
    phone: faker.phone.number({ style: "international" }),
    email: faker.internet
      .email({ firstName: name.split(" ")[0], lastName: "supply" })
      .toLowerCase(),
    itemsSupplied: faker.number.int({ min: 6, max: 24 }),
    status: faker.number.float({ min: 0, max: 1 }) > 0.12 ? "Active" : "Inactive",
  }))
}

export const SUPPLIERS: Supplier[] = buildSuppliers()

/** Each catalog drug produces one batch, with ~30% getting a second batch (different expiry/qty) so inventory reads like a real batch-tracked store. */
function buildDrugs(): Drug[] {
  const drugs: Drug[] = []
  let counter = 1

  for (const entry of DRUG_CATALOG) {
    const batchCount = faker.number.float({ min: 0, max: 1 }) > 0.72 ? 2 : 1
    for (let b = 0; b < batchCount; b++) {
      const reorderLevel = faker.number.int({ min: 20, max: 60 })
      const stockRoll = faker.number.float({ min: 0, max: 1 })
      const stockQty =
        stockRoll < 0.1
          ? 0
          : stockRoll < 0.3
            ? faker.number.int({ min: 1, max: reorderLevel })
            : faker.number.int({ min: reorderLevel + 1, max: reorderLevel * 8 })

      const expiryRoll = faker.number.float({ min: 0, max: 1 })
      const expiryDate =
        expiryRoll < 0.07
          ? faker.date.recent({ days: 120, refDate: NOW })
          : expiryRoll < 0.17
            ? faker.date.soon({ days: 45, refDate: NOW })
            : faker.date.future({ years: 3, refDate: NOW })

      drugs.push({
        id: id("DRG", counter),
        name: entry.name,
        category: entry.category,
        unit: entry.unit,
        stockQty,
        reorderLevel,
        expiryDate: expiryDate.toISOString(),
        price: faker.number.int({ min: 150, max: 18000 }),
        supplierId: pick(SUPPLIERS).id,
        batchNo: `B${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
      })
      counter++
    }
  }

  return drugs
}

export const DRUGS: Drug[] = buildDrugs()

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

const DOSAGES = [
  "1 tab BD x 5/7",
  "1 tab OD x 7/7",
  "2 tabs TDS x 5/7",
  "1 cap OD x 10/7",
  "1 sachet OD",
  "As directed",
]

function buildPrescriptions(count: number): Prescription[] {
  const prescriptions: Prescription[] = []
  for (let i = 1; i <= count; i++) {
    const patient = pick(PATIENTS)
    const doctor = pick(DOCTORS)
    const medCount = faker.number.int({ min: 1, max: 3 })
    const meds = faker.helpers.arrayElements(DRUGS, medCount).map((drug) => ({
      drugId: drug.id,
      drugName: drug.name,
      dosage: pick(DOSAGES),
      quantity: faker.number.int({ min: 1, max: 30 }),
    }))

    // Keep the first handful dated "today" (at varying times) so Dispensed-Today /
    // To-Dispense stat cards always have something to show, regardless of when this runs.
    const isRecent = i <= 8
    const date = isRecent
      ? new Date(NOW.getTime() - faker.number.int({ min: 0, max: 8 }) * 3600_000)
      : faker.date.recent({ days: 45, refDate: NOW })

    prescriptions.push({
      id: id("RX", i),
      patientId: patient.id,
      medications: meds,
      prescribedByStaffId: doctor.id,
      date: date.toISOString(),
      status: isRecent
        ? pick(["To Dispense", "Dispensed", "Dispensed"] as const)
        : pick(["To Dispense", "To Dispense", "Dispensed", "Dispensed", "Dispensed", "Cancelled"] as const),
    })
  }
  return prescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const PRESCRIPTIONS: Prescription[] = buildPrescriptions(46)

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

function buildPurchaseOrders(count: number): PurchaseOrder[] {
  const orders: PurchaseOrder[] = []
  for (let i = 1; i <= count; i++) {
    const supplier = pick(SUPPLIERS)
    const itemCount = faker.number.int({ min: 2, max: 6 })
    const items = faker.helpers.arrayElements(DRUGS, itemCount).map((drug) => ({
      drugId: drug.id,
      drugName: drug.name,
      quantity: faker.number.int({ min: 20, max: 200 }),
      unitPrice: drug.price,
    }))
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    orders.push({
      id: id("PO", i),
      supplierId: supplier.id,
      items,
      totalAmount,
      status: pick(["Draft", "Pending", "Pending", "Approved", "Delivered", "Delivered"] as const),
      date: faker.date.recent({ days: 90, refDate: NOW }).toISOString(),
    })
  }
  return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const PURCHASE_ORDERS: PurchaseOrder[] = buildPurchaseOrders(15)

export function getPurchaseOrderById(poId: string): PurchaseOrder | undefined {
  return PURCHASE_ORDERS.find((p) => p.id === poId)
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`
}
