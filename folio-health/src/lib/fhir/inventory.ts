import type { Basic, Medication, Organization, Reference } from "@medplum/fhirtypes"
import type {
  Drug,
  DrugCategory,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  Supplier,
} from "@/lib/mock/pharmacy"
import {
  basicCode,
  buildExtensions,
  fieldUrl,
  readDate,
  readNumber,
  readReference,
  readString,
} from "./custom"

/**
 * Pharmacy stock to FHIR.
 *
 *   Supplier      -> Organization (type "supplier")  — real FHIR
 *   Drug          -> Medication + stock extensions   — real FHIR + Folio fields
 *   PurchaseOrder -> Basic "purchase-order"          — no R4 resource exists
 *
 * The split is deliberate. A supplier IS an organization and a drug IS a
 * medication, so those use the real resources and stay interchangeable. Stock
 * level, reorder point, batch and expiry have no R4 home (InventoryItem is R5),
 * so they hang off the Medication as Folio extensions rather than being pushed
 * into a resource that means something else.
 */

export const SUPPLIER_TYPE = {
  system: "http://terminology.hl7.org/CodeSystem/organization-type",
  code: "prov",
  display: "Healthcare Provider",
}

/** Distinguishes a supplier Organization from a facility Organization. */
export const SUPPLIER_MARKER = {
  system: "https://folio.health/fhir/sid/organization-role",
  code: "supplier",
  display: "Supplier",
}

export const DRUG_CATEGORY_SYSTEM = "https://folio.health/fhir/sid/drug-category"

const STOCK = {
  qty: "https://folio.health/fhir/StructureDefinition/stock-qty",
  reorder: "https://folio.health/fhir/StructureDefinition/reorder-level",
  price: "https://folio.health/fhir/StructureDefinition/unit-price",
  unit: "https://folio.health/fhir/StructureDefinition/dispense-unit",
  supplier: "https://folio.health/fhir/StructureDefinition/supplier",
} as const

// -- Suppliers --------------------------------------------------------------

export function isSupplier(organization: Organization): boolean {
  return (
    organization.type?.some((t) =>
      t.coding?.some((c) => c.system === SUPPLIER_MARKER.system && c.code === "supplier")
    ) ?? false
  )
}

export function toSupplier(organization: Organization): Supplier {
  const phone = organization.telecom?.find((t) => t.system === "phone")?.value ?? ""
  const email = organization.telecom?.find((t) => t.system === "email")?.value ?? ""
  const contact = organization.contact?.[0]?.name
  return {
    id: organization.id ?? "",
    name: organization.name ?? "Unnamed supplier",
    contact:
      contact?.text ?? [contact?.given?.join(" "), contact?.family].filter(Boolean).join(" "),
    phone,
    email,
    // Counted by the caller from how many Medications name this supplier —
    // the Organization itself does not know.
    itemsSupplied: 0,
    status: organization.active === false ? "Inactive" : "Active",
  }
}

export function buildSupplier(
  input: Pick<Supplier, "name" | "contact" | "phone" | "email"> & { active?: boolean }
): Organization {
  return {
    resourceType: "Organization",
    active: input.active ?? true,
    name: input.name,
    type: [{ coding: [SUPPLIER_TYPE] }, { coding: [SUPPLIER_MARKER] }],
    telecom: [
      ...(input.phone ? [{ system: "phone" as const, value: input.phone }] : []),
      ...(input.email ? [{ system: "email" as const, value: input.email }] : []),
    ],
    ...(input.contact ? { contact: [{ name: { text: input.contact } }] } : {}),
  }
}

// -- Drugs ------------------------------------------------------------------

export function toDrug(medication: Medication): Drug {
  const batch = medication.batch
  return {
    id: medication.id ?? "",
    name: medication.code?.text ?? medication.code?.coding?.[0]?.display ?? "Unnamed drug",
    category:
      (medication.code?.coding?.find((c) => c.system === DRUG_CATEGORY_SYSTEM)?.code as
        | DrugCategory
        | undefined) ?? ("Other" as DrugCategory),
    unit: readString(medication.extension, STOCK.unit) ?? "unit",
    // 0 is the honest default for a count: an unrecorded stock level is not
    // stock, and rounding up would let the pharmacy dispense what it lacks.
    stockQty: readNumber(medication.extension, STOCK.qty) ?? 0,
    reorderLevel: readNumber(medication.extension, STOCK.reorder) ?? 0,
    // batch.expirationDate is real FHIR — used in preference to an extension.
    expiryDate: batch?.expirationDate ?? readDate(medication.extension, "expiry") ?? "",
    price: readNumber(medication.extension, STOCK.price) ?? 0,
    supplierId: readReference(medication.extension, STOCK.supplier)?.split("/")[1] ?? "",
    batchNo: batch?.lotNumber ?? "",
  }
}

export interface BuildDrugInput extends Omit<Drug, "id"> {
  supplierReference?: Reference<Organization>
}

export function buildDrug(input: BuildDrugInput): Medication {
  return {
    resourceType: "Medication",
    status: "active",
    code: {
      coding: [{ system: DRUG_CATEGORY_SYSTEM, code: input.category, display: input.category }],
      text: input.name,
    },
    // Batch and expiry are first-class on Medication; only the commercial and
    // stock-keeping fields need extensions.
    batch: {
      ...(input.batchNo ? { lotNumber: input.batchNo } : {}),
      ...(input.expiryDate ? { expirationDate: input.expiryDate.slice(0, 10) } : {}),
    },
    extension: [
      { url: STOCK.qty, valueInteger: Math.max(0, Math.round(input.stockQty)) },
      { url: STOCK.reorder, valueInteger: Math.max(0, Math.round(input.reorderLevel)) },
      ...(input.price ? [{ url: STOCK.price, valueDecimal: input.price }] : []),
      ...(input.unit ? [{ url: STOCK.unit, valueString: input.unit }] : []),
      ...(input.supplierReference
        ? [{ url: STOCK.supplier, valueReference: input.supplierReference }]
        : []),
    ],
  }
}

/**
 * Adjust stock by a delta.
 *
 * Read-modify-write on the whole Medication, never a blind set: two dispenses
 * racing would otherwise both write the level they each computed and one would
 * be lost. Clamped at zero — negative stock is not a real quantity.
 */
export function withStockDelta(medication: Medication, delta: number): Medication {
  const current = readNumber(medication.extension, STOCK.qty) ?? 0
  const next = Math.max(0, current + delta)
  const others = (medication.extension ?? []).filter((e) => e.url !== STOCK.qty)
  return { ...medication, extension: [...others, { url: STOCK.qty, valueInteger: next }] }
}

// -- Purchase orders --------------------------------------------------------

const PO = {
  supplier: fieldUrl("purchase-order", "supplier"),
  status: fieldUrl("purchase-order", "status"),
  orderedAt: fieldUrl("purchase-order", "orderedAt"),
  expectedAt: fieldUrl("purchase-order", "expectedAt"),
  total: fieldUrl("purchase-order", "total"),
  items: fieldUrl("purchase-order", "items"),
} as const

export function toPurchaseOrder(basic: Basic): PurchaseOrder {
  let items: PurchaseOrderItem[] = []
  const raw = readString(basic.extension, PO.items)
  if (raw) {
    try {
      items = JSON.parse(raw) as PurchaseOrderItem[]
    } catch {
      // A corrupt line-item payload must not blank the whole order — the header
      // still tells the buyer what was ordered from whom.
      items = []
    }
  }

  return {
    id: basic.id ?? "",
    supplierId: readReference(basic.extension, PO.supplier)?.split("/")[1] ?? "",
    items,
    status: (readString(basic.extension, PO.status) as PurchaseOrderStatus) ?? "Draft",
    date: readDate(basic.extension, PO.orderedAt) ?? basic.meta?.lastUpdated ?? "",
    totalAmount: readNumber(basic.extension, PO.total) ?? 0,
  }
}

export interface BuildPurchaseOrderInput {
  supplier: Reference<Organization>
  items: PurchaseOrderItem[]
  status?: PurchaseOrderStatus
  expectedAt?: string
}

export function buildPurchaseOrder(input: BuildPurchaseOrderInput): Basic {
  // Computed here rather than trusted from the caller: a total that disagrees
  // with its own line items is worse than no total.
  const total = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return {
    resourceType: "Basic",
    code: basicCode("purchase-order"),
    created: new Date().toISOString().slice(0, 10),
    extension: [
      { url: PO.supplier, valueReference: input.supplier },
      { url: PO.status, valueString: input.status ?? "Draft" },
      { url: PO.orderedAt, valueDateTime: new Date().toISOString() },
      { url: PO.total, valueDecimal: total },
      // Line items are stored as JSON. FHIR has no repeating-complex-extension
      // shape that survives round-tripping cleanly here, and an order's lines
      // are only ever read as a set.
      { url: PO.items, valueString: JSON.stringify(input.items) },
      ...(input.expectedAt ? [{ url: PO.expectedAt, valueDateTime: input.expectedAt }] : []),
    ],
    ...buildExtensions("purchase-order", {}),
  }
}

export function withPurchaseOrderStatus(basic: Basic, status: PurchaseOrderStatus): Basic {
  const others = (basic.extension ?? []).filter((e) => e.url !== PO.status)
  return { ...basic, extension: [...others, { url: PO.status, valueString: status }] }
}
