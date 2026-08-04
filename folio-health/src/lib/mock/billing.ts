import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { PATIENTS } from "./patients"
import { STAFF } from "./staff"
import type { Department } from "@/types/core"

seedFaker(21)

const ACCOUNTANTS = STAFF.filter((s) => s.role === "Accountant")

const NOW = new Date()

const BILLABLE_DEPARTMENTS: Department[] = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedics",
  "Surgery",
  "Radiology",
  "Laboratory",
  "Pharmacy",
  "Emergency Medicine",
]

const SERVICE_LINE_ITEMS = [
  { description: "Consultation Fee", min: 3000, max: 12000 },
  { description: "Laboratory Test Panel", min: 4000, max: 25000 },
  { description: "Radiology / Imaging", min: 8000, max: 60000 },
  { description: "Ward Admission (per day)", min: 15000, max: 45000 },
  { description: "Surgical Procedure Fee", min: 50000, max: 400000 },
  { description: "Pharmacy Charges", min: 2000, max: 30000 },
  { description: "Nursing Care Fee", min: 3000, max: 10000 },
  { description: "Medical Supplies", min: 1500, max: 12000 },
]

export interface InvoiceItem {
  description: string
  qty: number
  unitPrice: number
}

export type InvoiceStatus = "Paid" | "Partial" | "Unpaid"

export interface Invoice {
  id: string
  patientId: string
  date: string
  dueDate: string
  department: Department
  items: InvoiceItem[]
  amount: number
  paid: number
  balance: number
  status: InvoiceStatus
}

function buildInvoiceItems(): InvoiceItem[] {
  const count = faker.number.int({ min: 1, max: 4 })
  return faker.helpers.arrayElements(SERVICE_LINE_ITEMS, count).map((svc) => ({
    description: svc.description,
    qty: faker.number.int({ min: 1, max: 3 }),
    unitPrice: faker.number.int({ min: svc.min, max: svc.max }),
  }))
}

function buildInvoices(count: number): Invoice[] {
  const invoices: Invoice[] = []
  for (let i = 1; i <= count; i++) {
    const patient = pick(PATIENTS)
    const items = buildInvoiceItems()
    const amount = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
    const status = pick(["Paid", "Paid", "Paid", "Partial", "Unpaid"] as const)
    const paid =
      status === "Paid"
        ? amount
        : status === "Partial"
          ? Math.round(amount * faker.number.float({ min: 0.2, max: 0.75 }))
          : 0
    const date = faker.date.recent({ days: 150, refDate: NOW })

    invoices.push({
      id: id("INV", i),
      patientId: patient.id,
      date: date.toISOString(),
      dueDate: faker.date.soon({ days: 30, refDate: date }).toISOString(),
      department: pick(BILLABLE_DEPARTMENTS),
      items,
      amount,
      paid,
      balance: amount - paid,
      status,
    })
  }
  return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const INVOICES: Invoice[] = buildInvoices(62)

export function getInvoiceById(invoiceId: string): Invoice | undefined {
  return INVOICES.find((i) => i.id === invoiceId)
}

export type PaymentMethod = "Cash" | "Card" | "Transfer" | "Insurance"

export interface Payment {
  id: string
  invoiceId: string
  patientId: string
  amount: number
  method: PaymentMethod
  date: string
  recordedByStaffId: string
}

function buildPayments(): Payment[] {
  const payments: Payment[] = []
  let counter = 1
  for (const invoice of INVOICES) {
    if (invoice.paid <= 0) continue
    // Frequently split a paid/partial invoice across two payments (installments)
    // so the payments ledger has meaningfully more rows than the invoice count.
    const splitInTwo = faker.number.float({ min: 0, max: 1 }) > 0.4
    if (splitInTwo) {
      const firstAmount = Math.round(invoice.paid * faker.number.float({ min: 0.35, max: 0.65 }))
      payments.push({
        id: id("PAY", counter++),
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: firstAmount,
        method: pick(["Cash", "Card", "Transfer", "Insurance"] as const),
        date: invoice.date,
        recordedByStaffId: pick(ACCOUNTANTS).id,
      })
      payments.push({
        id: id("PAY", counter++),
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: invoice.paid - firstAmount,
        method: pick(["Cash", "Card", "Transfer", "Insurance"] as const),
        date: faker.date.soon({ days: 5, refDate: new Date(invoice.date) }).toISOString(),
        recordedByStaffId: pick(ACCOUNTANTS).id,
      })
    } else {
      payments.push({
        id: id("PAY", counter++),
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: invoice.paid,
        method: pick(["Cash", "Card", "Transfer", "Insurance"] as const),
        date: invoice.date,
        recordedByStaffId: pick(ACCOUNTANTS).id,
      })
    }
  }
  return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const PAYMENTS: Payment[] = buildPayments()

export function getPaymentsForInvoice(invoiceId: string): Payment[] {
  return PAYMENTS.filter((p) => p.invoiceId === invoiceId)
}

export type ClaimStatus = "Submitted" | "Under Review" | "Approved" | "Rejected"

export interface Claim {
  id: string
  invoiceId: string
  patientId: string
  insurer: string
  amountClaimed: number
  amountApproved: number
  status: ClaimStatus
  date: string
}

function buildClaims(count: number): Claim[] {
  const insuredPatients = PATIENTS.filter((p) => Boolean(p.insurance?.provider))
  const pool = insuredPatients.length > 0 ? insuredPatients : PATIENTS
  const claims: Claim[] = []
  for (let i = 1; i <= count; i++) {
    const patient = pick(pool)
    const patientInvoices = INVOICES.filter((inv) => inv.patientId === patient.id)
    const invoice = patientInvoices.length > 0 ? pick(patientInvoices) : pick(INVOICES)
    const status = pick(["Submitted", "Under Review", "Approved", "Approved", "Rejected"] as const)
    const amountClaimed = invoice.amount
    const amountApproved =
      status === "Approved" ? Math.round(amountClaimed * faker.number.float({ min: 0.7, max: 1 })) : 0

    claims.push({
      id: id("CLM", i),
      invoiceId: invoice.id,
      patientId: patient.id,
      insurer: patient.insurance?.provider ?? "National Health Insurance Scheme",
      amountClaimed,
      amountApproved,
      status,
      date: faker.date.recent({ days: 100, refDate: NOW }).toISOString(),
    })
  }
  return claims.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const CLAIMS: Claim[] = buildClaims(16)

export type RefundStatus = "Pending" | "Processed" | "Rejected"

export interface Refund {
  id: string
  invoiceId: string
  patientId: string
  amount: number
  reason: string
  status: RefundStatus
  date: string
}

const REFUND_REASONS = [
  "Duplicate billing",
  "Service not rendered",
  "Overpayment by patient",
  "Insurance reprocessing",
  "Cancelled procedure",
  "Billing error correction",
]

function buildRefunds(count: number): Refund[] {
  const paidInvoices = INVOICES.filter((inv) => inv.paid > 0)
  const refunds: Refund[] = []
  for (let i = 1; i <= count; i++) {
    const invoice = pick(paidInvoices)
    refunds.push({
      id: id("REF", i),
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      amount: Math.round(invoice.paid * faker.number.float({ min: 0.15, max: 0.6 })),
      reason: pick(REFUND_REASONS),
      status: pick(["Pending", "Processed", "Processed", "Rejected"] as const),
      date: faker.date.recent({ days: 60, refDate: NOW }).toISOString(),
    })
  }
  return refunds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const REFUNDS: Refund[] = buildRefunds(11)

export function daysOverdue(dueDate: string): number {
  const diff = NOW.getTime() - new Date(dueDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export type OutstandingStatus = "Overdue" | "Partial"

export interface OutstandingBill {
  invoiceId: string
  patientId: string
  amountDue: number
  daysOverdue: number
  lastReminderSent: string | null
  status: OutstandingStatus
}

function buildOutstandingBills(count: number): OutstandingBill[] {
  const candidates = INVOICES.filter((inv) => inv.balance > 0)
  const chosen = faker.helpers.arrayElements(candidates, Math.min(count, candidates.length))
  return chosen
    .map((inv): OutstandingBill => {
      const overdue = daysOverdue(inv.dueDate)
      return {
        invoiceId: inv.id,
        patientId: inv.patientId,
        amountDue: inv.balance,
        daysOverdue: overdue,
        lastReminderSent:
          faker.number.float({ min: 0, max: 1 }) > 0.45
            ? faker.date.recent({ days: 20, refDate: NOW }).toISOString()
            : null,
        status: overdue > 0 ? "Overdue" : "Partial",
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}

export const OUTSTANDING_BILLS: OutstandingBill[] = buildOutstandingBills(20)

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`
}
