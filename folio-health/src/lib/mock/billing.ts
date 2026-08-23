// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { Department } from "@/types/core"

const NOW = new Date()

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

export const INVOICES: Invoice[] = []

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

export const PAYMENTS: Payment[] = []

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

export const CLAIMS: Claim[] = []

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

export const REFUNDS: Refund[] = []

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

export const OUTSTANDING_BILLS: OutstandingBill[] = []

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`
}
