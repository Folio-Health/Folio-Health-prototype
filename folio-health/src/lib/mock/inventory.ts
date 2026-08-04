import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { STAFF } from "./staff"
import type { Department } from "@/types/core"

seedFaker(43)

const NOW = new Date()

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

const SUPPLY_CATALOG: { name: string; category: (typeof SUPPLY_CATEGORIES)[number]; unit: string }[] = [
  { name: "Nitrile Examination Gloves (Box)", category: "PPE & Protective Wear", unit: "box" },
  { name: "Surgical Face Masks (Box)", category: "PPE & Protective Wear", unit: "box" },
  { name: "N95 Respirators", category: "PPE & Protective Wear", unit: "pcs" },
  { name: "Disposable Isolation Gowns", category: "PPE & Protective Wear", unit: "pcs" },
  { name: "Face Shields", category: "PPE & Protective Wear", unit: "pcs" },
  { name: "Sterile Gauze Swabs", category: "Wound Care", unit: "pack" },
  { name: "Adhesive Bandages", category: "Wound Care", unit: "box" },
  { name: "Elastic Crepe Bandages", category: "Wound Care", unit: "roll" },
  { name: "Wound Dressing Pads", category: "Wound Care", unit: "pack" },
  { name: "Antiseptic Solution (500ml)", category: "Wound Care", unit: "bottle" },
  { name: "IV Cannulas (18G)", category: "IV & Infusion", unit: "box" },
  { name: "IV Cannulas (22G)", category: "IV & Infusion", unit: "box" },
  { name: "IV Infusion Sets", category: "IV & Infusion", unit: "pcs" },
  { name: "Normal Saline 0.9% (1L)", category: "IV & Infusion", unit: "bag" },
  { name: "Dextrose 5% (1L)", category: "IV & Infusion", unit: "bag" },
  { name: "Syringes (5ml)", category: "Diagnostic Consumables", unit: "box" },
  { name: "Syringes (10ml)", category: "Diagnostic Consumables", unit: "box" },
  { name: "Blood Collection Tubes", category: "Diagnostic Consumables", unit: "box" },
  { name: "Lancets", category: "Diagnostic Consumables", unit: "box" },
  { name: "Urine Test Strips", category: "Diagnostic Consumables", unit: "box" },
  { name: "Surgical Sutures (Assorted)", category: "Surgical Consumables", unit: "box" },
  { name: "Scalpel Blades", category: "Surgical Consumables", unit: "box" },
  { name: "Surgical Drapes", category: "Surgical Consumables", unit: "pack" },
  { name: "Sterile Surgical Gloves", category: "Surgical Consumables", unit: "box" },
  { name: "Bed Sheets (Disposable)", category: "General Ward Supplies", unit: "pack" },
  { name: "Patient Wristbands", category: "General Ward Supplies", unit: "roll" },
  { name: "Urinary Catheter Bags", category: "General Ward Supplies", unit: "pcs" },
  { name: "Disposable Bedpans", category: "General Ward Supplies", unit: "pcs" },
  { name: "Autoclave Pouches", category: "Sterilization", unit: "box" },
  { name: "Chlorine Disinfectant Tablets", category: "Sterilization", unit: "tub" },
  { name: "Instrument Sterilization Wrap", category: "Sterilization", unit: "roll" },
  { name: "Oxygen Nasal Cannula", category: "Respiratory", unit: "pcs" },
  { name: "Oxygen Face Masks", category: "Respiratory", unit: "pcs" },
  { name: "Nebulizer Kits", category: "Respiratory", unit: "pcs" },
]

function buildSupplies(): SupplyItem[] {
  return SUPPLY_CATALOG.map((entry, i) => {
    const reorderLevel = faker.number.int({ min: 20, max: 80 })
    const roll = faker.number.float({ min: 0, max: 1 })
    const quantity =
      roll < 0.1 ? 0 : roll < 0.28 ? faker.number.int({ min: 1, max: reorderLevel }) : faker.number.int({ min: reorderLevel + 1, max: reorderLevel * 6 })

    return {
      id: id("SUP-ITM", i + 1),
      name: entry.name,
      category: entry.category,
      quantity,
      unit: entry.unit,
      reorderLevel,
      unitCost: faker.number.int({ min: 200, max: 15000 }),
    }
  })
}

export const SUPPLY_ITEMS: SupplyItem[] = buildSupplies()

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

const EQUIPMENT_DEPTS: Department[] = [
  "Intensive Care Unit",
  "Surgery",
  "Radiology",
  "Laboratory",
  "Emergency Medicine",
  "General Medicine",
  "Cardiology",
  "Obstetrics & Gynecology",
  "Pediatrics",
]

const EQUIPMENT_CATALOG: { name: string; category: string }[] = [
  { name: "Patient Monitor (Multi Parameter)", category: "Monitoring" },
  { name: "Infusion Pump", category: "Infusion" },
  { name: "Defibrillator", category: "Emergency" },
  { name: "Portable Ventilator", category: "Respiratory Support" },
  { name: "Ultrasound Scanner", category: "Imaging" },
  { name: "ECG Machine", category: "Diagnostics" },
  { name: "Anesthesia Workstation", category: "Surgical" },
  { name: "Surgical Table", category: "Surgical" },
  { name: "Autoclave Sterilizer", category: "Sterilization" },
  { name: "X Ray Machine (Mobile)", category: "Imaging" },
  { name: "Centrifuge", category: "Laboratory" },
  { name: "Incubator (Neonatal)", category: "Neonatal Care" },
  { name: "Phototherapy Unit", category: "Neonatal Care" },
  { name: "Suction Pump", category: "General" },
  { name: "Wheelchair", category: "Mobility" },
  { name: "Hospital Bed (Electric)", category: "Ward Equipment" },
  { name: "Pulse Oximeter", category: "Monitoring" },
  { name: "Blood Gas Analyzer", category: "Laboratory" },
  { name: "Syringe Pump", category: "Infusion" },
  { name: "Fetal Doppler", category: "Obstetric" },
]

function buildEquipment(): Equipment[] {
  return EQUIPMENT_CATALOG.map((entry, i) => {
    const status = pick(["Operational", "Operational", "Operational", "Operational", "Under Maintenance", "Out of Service"] as const)
    return {
      id: id("EQP", i + 1),
      name: entry.name,
      category: entry.category,
      serialNumber: `SN-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`,
      department: pick(EQUIPMENT_DEPTS),
      status,
      lastServicedDate: faker.date.recent({ days: 240, refDate: NOW }).toISOString(),
    }
  })
}

export const EQUIPMENT: Equipment[] = buildEquipment()

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

const ZONE_TEMPLATES: { name: string; location: string; temperatureControlled: boolean }[] = [
  { name: "Zone A: General Supplies", location: "Main Warehouse, Ground Floor", temperatureControlled: false },
  { name: "Zone B: Cold Chain Storage", location: "Main Warehouse, Ground Floor", temperatureControlled: true },
  { name: "Zone C: Surgical Consumables", location: "Main Warehouse, Level 1", temperatureControlled: false },
  { name: "Zone D: Pharmacy Reserve", location: "Main Warehouse, Level 1", temperatureControlled: true },
  { name: "Zone E: Equipment Bay", location: "Annex Building, Ground Floor", temperatureControlled: false },
  { name: "Zone F: PPE & Consumables", location: "Annex Building, Level 1", temperatureControlled: false },
  { name: "Ward Supply Room, East Wing", location: "East Wing, Level 2", temperatureControlled: false },
  { name: "Ward Supply Room, West Wing", location: "West Wing, Level 2", temperatureControlled: false },
]

function buildWarehouseZones(): WarehouseZone[] {
  return ZONE_TEMPLATES.map((zone, i) => {
    const capacity = faker.number.int({ min: 400, max: 1200 })
    return {
      id: id("WHZ", i + 1),
      name: zone.name,
      location: zone.location,
      itemCount: faker.number.int({ min: Math.floor(capacity * 0.2), max: Math.floor(capacity * 0.95) }),
      capacity,
      temperatureControlled: zone.temperatureControlled,
    }
  })
}

export const WAREHOUSE_ZONES: WarehouseZone[] = buildWarehouseZones()

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

function buildPurchaseRequests(count: number): PurchaseRequest[] {
  const requests: PurchaseRequest[] = []
  const requesters = faker.helpers.arrayElements(STAFF, Math.min(count, STAFF.length))

  for (let i = 1; i <= count; i++) {
    const requester = requesters[i - 1] ?? pick(STAFF)
    const itemCount = faker.number.int({ min: 1, max: 4 })
    const items = faker.helpers.arrayElements(SUPPLY_ITEMS, itemCount).map((s) => ({
      itemName: s.name,
      quantity: faker.number.int({ min: 10, max: 150 }),
    }))

    requests.push({
      id: id("PRQ", i),
      requestedByStaffId: requester.id,
      department: requester.department,
      items,
      status: pick(["Pending", "Pending", "Approved", "Approved", "Rejected", "Fulfilled", "Fulfilled"] as const),
      date: faker.date.recent({ days: 60, refDate: NOW }).toISOString(),
    })
  }

  return requests.sort((a, b) => b.date.localeCompare(a.date))
}

export const PURCHASE_REQUESTS: PurchaseRequest[] = buildPurchaseRequests(18)

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

const LOCATIONS = [
  "Main Warehouse",
  "Zone A: General Supplies",
  "Zone B: Cold Chain Storage",
  "Zone C: Surgical Consumables",
  "Ward Supply Room, East Wing",
  "Ward Supply Room, West Wing",
  "Pharmacy Reserve",
  "Emergency Department",
  "Operating Theatre",
  "Supplier Delivery Bay",
]

function buildStockMovements(count: number): StockMovement[] {
  const movements: StockMovement[] = []

  for (let i = 1; i <= count; i++) {
    const item = pick(SUPPLY_ITEMS)
    const type = pick(["In", "Out", "Transfer", "Adjustment"] as const)
    const [from, to] =
      type === "In"
        ? ["Supplier Delivery Bay", "Main Warehouse"]
        : type === "Out"
          ? [pick(LOCATIONS), pick(["Emergency Department", "Operating Theatre", "Ward Supply Room, East Wing", "Ward Supply Room, West Wing"])]
          : type === "Transfer"
            ? [pick(LOCATIONS), pick(LOCATIONS)]
            : [pick(LOCATIONS), pick(LOCATIONS)]

    movements.push({
      id: id("MOV", i),
      itemName: item.name,
      movementType: type,
      quantity: faker.number.int({ min: 5, max: 200 }),
      fromLocation: from,
      toLocation: to,
      date: faker.date.recent({ days: 45, refDate: NOW }).toISOString(),
      recordedByStaffId: pick(STAFF).id,
    })
  }

  return movements.sort((a, b) => b.date.localeCompare(a.date))
}

export const STOCK_MOVEMENTS: StockMovement[] = buildStockMovements(24)
