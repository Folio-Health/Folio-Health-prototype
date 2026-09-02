import type {
  Basic,
  Claim as FhirClaim,
  ClaimResponse,
  Invoice as FhirInvoice,
  Organization,
  PaymentReconciliation,
  Practitioner,
  PractitionerRole,
  Reference,
} from "@medplum/fhirtypes"

/** Who can be recorded as taking a payment or providing care. */
type BillingActor = Reference<Organization | Practitioner | PractitionerRole>
import type { Department } from "@/types/core"
import type {
  Claim,
  ClaimStatus,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  OutstandingBill,
  OutstandingStatus,
  Payment,
  PaymentMethod,
  Refund,
  RefundStatus,
} from "@/lib/mock/billing"
import { basicCode, fieldUrl, readDate, readNumber, readReference, readString } from "./custom"

/**
 * Billing to FHIR.
 *
 *   Invoice         -> Invoice                      (real R4)
 *   Payment         -> PaymentReconciliation        (real R4)
 *   Claim           -> Claim + ClaimResponse        (real R4)
 *   Refund          -> Basic "refund"               (no R4 resource)
 *   OutstandingBill -> DERIVED from unpaid invoices (never stored)
 *
 * Billing is the best-covered domain in R4, so almost all of this uses real
 * resources. Only refunds fall back to Basic.
 *
 * OUTSTANDING BILLS ARE NOT A RESOURCE. An overdue bill is an unpaid invoice
 * past its due date — a view, not a record. Storing it separately would create
 * a second answer to "does this patient owe us money", and the two would
 * diverge the moment a payment landed against one and not the other.
 *
 * MONEY IS NEVER RECOMPUTED FROM A STORED TOTAL. Invoice balance is derived
 * from the line items and the payments actually recorded against it, so a
 * corrupted total cannot make the ledger disagree with itself.
 */

export const CURRENCY = "NGN"

const DEPARTMENT_SYSTEM = "https://folio.health/fhir/sid/department"
const PAYMENT_METHOD_SYSTEM = "https://folio.health/fhir/sid/payment-method"

/** FHIR Invoice has no due date, so it is carried as an extension. */
export const INVOICE_DUE_DATE_URL = "https://folio.health/fhir/StructureDefinition/invoice-due-date"

// -- Invoices ---------------------------------------------------------------

export function toInvoiceItems(invoice: FhirInvoice): InvoiceItem[] {
  return (invoice.lineItem ?? []).map((line) => {
    const priceComponent = line.priceComponent?.[0]
    return {
      description:
        line.chargeItemCodeableConcept?.text ??
        line.chargeItemCodeableConcept?.coding?.[0]?.display ??
        "Item",
      qty: priceComponent?.factor ?? 1,
      unitPrice: priceComponent?.amount?.value ?? 0,
    }
  })
}

/**
 * @param paidAmount total already recorded against this invoice. Passed in
 *   rather than read off the invoice, because payments live on their own
 *   resources and the invoice must not carry a figure that can go stale.
 */
export function toInvoice(invoice: FhirInvoice, paidAmount: number): Invoice {
  const items = toInvoiceItems(invoice)
  // Computed from the lines, not from totalGross: a stored total that
  // disagrees with its own line items is worse than no total.
  const amount = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const paid = Math.min(paidAmount, amount)
  const balance = Math.max(0, amount - paid)

  let status: InvoiceStatus = "Unpaid"
  if (balance === 0 && amount > 0) status = "Paid"
  else if (paid > 0) status = "Partial"

  return {
    id: invoice.id ?? "",
    patientId: invoice.subject?.reference?.split("/")[1] ?? "",
    date: invoice.date ?? invoice.meta?.lastUpdated ?? "",
    // FHIR Invoice has no due date; carried as an extension by buildInvoice.
    dueDate: readDate(invoice.extension, INVOICE_DUE_DATE_URL) ?? invoice.date ?? "",
    department:
      (invoice.type?.coding?.find((c) => c.system === DEPARTMENT_SYSTEM)?.code as
        | Department
        | undefined) ?? ("General" as Department),
    items,
    amount,
    paid,
    balance,
    status,
  }
}

export interface BuildInvoiceInput {
  patientId: string
  department: Department
  items: InvoiceItem[]
  dueDate?: string
  account?: Reference
}

export function buildInvoice(input: BuildInvoiceInput): FhirInvoice {
  return {
    resourceType: "Invoice",
    // "issued" means the bill has been raised and is payable. A draft invoice
    // would not appear in outstanding balances, which is not what raising one
    // in this app means.
    status: "issued",
    type: {
      coding: [{ system: DEPARTMENT_SYSTEM, code: input.department, display: input.department }],
      text: input.department,
    },
    subject: { reference: `Patient/${input.patientId}` },
    date: new Date().toISOString(),
    lineItem: input.items.map((item, index) => ({
      sequence: index + 1,
      chargeItemCodeableConcept: { text: item.description },
      priceComponent: [
        {
          type: "base",
          factor: item.qty,
          amount: { value: item.unitPrice, currency: CURRENCY },
        },
      ],
    })),
    totalGross: {
      value: input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
      currency: CURRENCY,
    },
    ...(input.dueDate
      ? { extension: [{ url: INVOICE_DUE_DATE_URL, valueDateTime: input.dueDate }] }
      : {}),
  }
}

// -- Payments ---------------------------------------------------------------

export function toPayment(reconciliation: PaymentReconciliation): Payment {
  const detail = reconciliation.detail?.[0]
  return {
    id: reconciliation.id ?? "",
    invoiceId: detail?.request?.reference?.split("/")[1] ?? "",
    patientId: detail?.payee?.reference?.split("/")[1] ?? "",
    amount: reconciliation.paymentAmount?.value ?? 0,
    method:
      (reconciliation.formCode?.coding?.find((c) => c.system === PAYMENT_METHOD_SYSTEM)?.code as
        | PaymentMethod
        | undefined) ?? "Cash",
    date: reconciliation.paymentDate ?? reconciliation.created ?? "",
    recordedByStaffId: reconciliation.requestor?.reference?.split("/")[1] ?? "",
  }
}

export interface BuildPaymentInput {
  invoiceId: string
  patientId: string
  amount: number
  method: PaymentMethod
  recordedBy?: BillingActor
}

export function buildPayment(input: BuildPaymentInput): PaymentReconciliation {
  const now = new Date().toISOString()
  return {
    resourceType: "PaymentReconciliation",
    status: "active",
    created: now,
    paymentDate: now.slice(0, 10),
    paymentAmount: { value: input.amount, currency: CURRENCY },
    formCode: {
      coding: [{ system: PAYMENT_METHOD_SYSTEM, code: input.method, display: input.method }],
      text: input.method,
    },
    detail: [
      {
        type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/payment-type", code: "payment" }] },
        request: { reference: `Invoice/${input.invoiceId}` },
        payee: { reference: `Patient/${input.patientId}` },
        date: now.slice(0, 10),
        amount: { value: input.amount, currency: CURRENCY },
      },
    ],
    ...(input.recordedBy ? { requestor: input.recordedBy } : {}),
  }
}

// -- Claims -----------------------------------------------------------------

export function toClaimStatus(claim: FhirClaim, response: ClaimResponse | undefined): ClaimStatus {
  if (!response) return claim.status === "active" ? "Submitted" : "Under Review"
  switch (response.outcome) {
    case "complete":
      return "Approved"
    case "error":
      return "Rejected"
    default:
      return "Under Review"
  }
}

export function toClaim(claim: FhirClaim, response: ClaimResponse | undefined): Claim {
  return {
    id: claim.id ?? "",
    invoiceId:
      claim.supportingInfo?.find((s) => s.valueReference?.reference?.startsWith("Invoice/"))
        ?.valueReference?.reference?.split("/")[1] ?? "",
    patientId: claim.patient?.reference?.split("/")[1] ?? "",
    insurer: claim.insurer?.display ?? claim.insurer?.reference ?? "",
    amountClaimed: claim.total?.value ?? 0,
    // 0 until the insurer responds. Defaulting to the claimed amount would show
    // money as approved that nobody has agreed to pay.
    amountApproved: response?.total?.find((t) => t.amount)?.amount?.value ?? 0,
    status: toClaimStatus(claim, response),
    date: claim.created ?? claim.meta?.lastUpdated ?? "",
  }
}

export interface BuildClaimInput {
  invoiceId: string
  patientId: string
  insurer: string
  amountClaimed: number
  provider?: BillingActor
}

export function buildClaim(input: BuildClaimInput): FhirClaim {
  return {
    resourceType: "Claim",
    status: "active",
    type: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/claim-type",
          code: "institutional",
          display: "Institutional",
        },
      ],
    },
    use: "claim",
    patient: { reference: `Patient/${input.patientId}` },
    created: new Date().toISOString(),
    // Insurer is free text: Nigerian HMOs are not in any FHIR-published
    // directory, and a reference to an Organization nobody created would be a
    // dangling pointer.
    insurer: { display: input.insurer },
    provider: input.provider ?? { display: "Folio Health" },
    priority: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/processpriority", code: "normal" }] },
    total: { value: input.amountClaimed, currency: CURRENCY },
    supportingInfo: [
      {
        sequence: 1,
        category: { text: "Invoice" },
        valueReference: { reference: `Invoice/${input.invoiceId}` },
      },
    ],
    // Required by FHIR even when there is one undifferentiated line.
    insurance: [{ sequence: 1, focal: true, coverage: { display: input.insurer } }],
  }
}

/** The insurer's decision, recorded as a ClaimResponse against the claim. */
export function buildClaimResponse(
  claim: FhirClaim,
  outcome: "complete" | "error",
  amountApproved: number
): ClaimResponse {
  return {
    resourceType: "ClaimResponse",
    status: "active",
    type: claim.type ?? { text: "institutional" },
    use: "claim",
    patient: claim.patient ?? { display: "Patient" },
    created: new Date().toISOString(),
    insurer: claim.insurer ?? { display: "Insurer" },
    request: claim.id ? { reference: `Claim/${claim.id}` } : undefined,
    outcome,
    total: [
      {
        category: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/adjudication", code: "benefit" }] },
        amount: { value: amountApproved, currency: CURRENCY },
      },
    ],
  }
}

// -- Refunds ----------------------------------------------------------------

const REFUND = {
  invoice: fieldUrl("refund", "invoice"),
  patient: fieldUrl("refund", "patient"),
  amount: fieldUrl("refund", "amount"),
  reason: fieldUrl("refund", "reason"),
  status: fieldUrl("refund", "status"),
  date: fieldUrl("refund", "date"),
} as const

export function toRefund(basic: Basic): Refund {
  return {
    id: basic.id ?? "",
    invoiceId: readReference(basic.extension, REFUND.invoice)?.split("/")[1] ?? "",
    patientId: readReference(basic.extension, REFUND.patient)?.split("/")[1] ?? "",
    amount: readNumber(basic.extension, REFUND.amount) ?? 0,
    reason: readString(basic.extension, REFUND.reason) ?? "",
    status: (readString(basic.extension, REFUND.status) as RefundStatus) ?? "Pending",
    date: readDate(basic.extension, REFUND.date) ?? basic.meta?.lastUpdated ?? "",
  }
}

export interface BuildRefundInput {
  invoiceId: string
  patientId: string
  amount: number
  reason: string
}

export function buildRefund(input: BuildRefundInput): Basic {
  const now = new Date().toISOString()
  return {
    resourceType: "Basic",
    code: basicCode("refund"),
    created: now.slice(0, 10),
    subject: { reference: `Patient/${input.patientId}` },
    extension: [
      { url: REFUND.invoice, valueReference: { reference: `Invoice/${input.invoiceId}` } },
      { url: REFUND.patient, valueReference: { reference: `Patient/${input.patientId}` } },
      { url: REFUND.amount, valueDecimal: input.amount },
      { url: REFUND.reason, valueString: input.reason },
      // Always starts Pending. A refund that records itself as processed would
      // claim money left the building before anyone sent it.
      { url: REFUND.status, valueString: "Pending" },
      { url: REFUND.date, valueDateTime: now },
    ],
  }
}

export function withRefundStatus(basic: Basic, status: RefundStatus): Basic {
  const others = (basic.extension ?? []).filter((e) => e.url !== REFUND.status)
  return { ...basic, extension: [...others, { url: REFUND.status, valueString: status }] }
}

// -- Outstanding ------------------------------------------------------------

/**
 * Outstanding bills, derived from invoices rather than stored.
 *
 * An invoice with a balance is outstanding; one past its due date is overdue.
 * `lastReminderSent` is null because reminders are not modelled — showing a
 * date there would claim a patient was chased when nobody contacted them.
 */
export function toOutstandingBills(invoices: Invoice[], now = new Date()): OutstandingBill[] {
  return invoices
    .filter((invoice) => invoice.balance > 0)
    .map((invoice) => {
      const due = invoice.dueDate ? new Date(invoice.dueDate) : null
      const daysOverdue =
        due && due < now ? Math.floor((now.getTime() - due.getTime()) / 86_400_000) : 0
      return {
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amountDue: invoice.balance,
        daysOverdue,
        lastReminderSent: null,
        // Annotated rather than inferred: a widened `string` here would let a
        // typo reach the status badge unchallenged.
        status: (daysOverdue > 0 ? "Overdue" : "Partial") as OutstandingStatus,
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}
