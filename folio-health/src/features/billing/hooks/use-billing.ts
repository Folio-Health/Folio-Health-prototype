"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  Basic,
  Claim as FhirClaim,
  ClaimResponse,
  Invoice as FhirInvoice,
  Patient,
  PaymentReconciliation,
  Resource,
} from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { FOLIO_BASIC_SYSTEM } from "@/lib/fhir/custom"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  buildClaim,
  buildClaimResponse,
  buildInvoice,
  buildPayment,
  buildRefund,
  toClaim,
  toInvoice,
  toOutstandingBills,
  toPayment,
  toRefund,
  withRefundStatus,
  type BuildClaimInput,
  type BuildInvoiceInput,
  type BuildPaymentInput,
  type BuildRefundInput,
} from "@/lib/fhir/billing"
import type { Claim, Invoice, OutstandingBill, Payment, Refund, RefundStatus } from "@/lib/mock/billing"

/**
 * Billing from Medplum.
 *
 * Replaces INVOICES / PAYMENTS / CLAIMS / REFUNDS / OUTSTANDING_BILLS, all
 * empty arrays since the fabricated records were removed.
 *
 * The invoice total, what has been paid and what is outstanding are all
 * DERIVED — from the line items and from the payments actually recorded. No
 * screen reads a stored balance, so the ledger cannot disagree with itself.
 */

const PAGE_SIZE = 200

export interface InvoiceWithPatient extends Invoice {
  patientName?: string
}

/** Payments keyed by the invoice they were made against. */
async function paymentsByInvoice(): Promise<Map<string, number>> {
  const { resources } = await searchResources<PaymentReconciliation>("PaymentReconciliation", {
    _count: PAGE_SIZE,
  })
  const totals = new Map<string, number>()
  for (const reconciliation of resources) {
    const payment = toPayment(reconciliation)
    if (!payment.invoiceId) continue
    totals.set(payment.invoiceId, (totals.get(payment.invoiceId) ?? 0) + payment.amount)
  }
  return totals
}

export function useInvoices(enabled = true) {
  return useQuery({
    queryKey: ["invoices"],
    enabled,
    queryFn: async (): Promise<InvoiceWithPatient[]> => {
      const [{ resources }, paid] = await Promise.all([
        searchResources<Resource>("Invoice", {
          _count: PAGE_SIZE,
          _sort: "-date",
          _include: "Invoice:subject",
        }),
        paymentsByInvoice(),
      ])

      const invoices = resources.filter((r): r is FhirInvoice => r.resourceType === "Invoice")
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      return invoices.map((invoice) => {
        const mapped = toInvoice(invoice, paid.get(invoice.id ?? "") ?? 0)
        return { ...mapped, patientName: names.get(mapped.patientId) }
      })
    },
  })
}

export interface PaymentWithPatient extends Payment {
  patientName?: string
}

export function usePayments(enabled = true) {
  return useQuery({
    queryKey: ["payments"],
    enabled,
    queryFn: async (): Promise<PaymentWithPatient[]> => {
      const { resources } = await searchResources<PaymentReconciliation>("PaymentReconciliation", {
        _count: PAGE_SIZE,
        _sort: "-created",
      })
      const payments = resources.map(toPayment)

      // Names resolved in one search over the patients actually referenced,
      // rather than an include (PaymentReconciliation has no subject to include).
      const patientIds = Array.from(new Set(payments.map((p) => p.patientId).filter(Boolean)))
      const names = new Map<string, string>()
      if (patientIds.length > 0) {
        const { resources: patients } = await searchResources<Patient>("Patient", {
          _id: patientIds.join(","),
          _count: PAGE_SIZE,
        })
        for (const patient of patients) {
          if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
        }
      }

      return payments.map((p) => ({ ...p, patientName: names.get(p.patientId) }))
    },
  })
}

export interface ClaimWithPatient extends Claim {
  patientName?: string
}

export function useClaims(enabled = true) {
  return useQuery({
    queryKey: ["claims"],
    enabled,
    queryFn: async (): Promise<ClaimWithPatient[]> => {
      const [{ resources }, { resources: responses }] = await Promise.all([
        searchResources<Resource>("Claim", {
          _count: PAGE_SIZE,
          _sort: "-created",
          _include: "Claim:patient",
        }),
        searchResources<ClaimResponse>("ClaimResponse", { _count: PAGE_SIZE }),
      ])

      const claims = resources.filter((r): r is FhirClaim => r.resourceType === "Claim")
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      const responseByClaim = new Map<string, ClaimResponse>()
      for (const response of responses) {
        const claimId = response.request?.reference?.split("/")[1]
        if (claimId) responseByClaim.set(claimId, response)
      }

      return claims.map((claim) => {
        const mapped = toClaim(claim, responseByClaim.get(claim.id ?? ""))
        return { ...mapped, patientName: names.get(mapped.patientId) }
      })
    },
  })
}

export function useRefunds(enabled = true) {
  return useQuery({
    queryKey: ["refunds"],
    enabled,
    queryFn: async (): Promise<Refund[]> => {
      const { resources } = await searchResources<Basic>("Basic", {
        code: `${FOLIO_BASIC_SYSTEM}|refund`,
        _count: PAGE_SIZE,
        _sort: "-_lastUpdated",
      })
      return resources.map(toRefund)
    },
  })
}

/**
 * Outstanding bills.
 *
 * Derived from the invoice list rather than fetched: an overdue bill is an
 * unpaid invoice past its due date, and storing that separately would give two
 * answers to whether a patient owes money.
 */
export function useOutstandingBills(enabled = true) {
  const invoices = useInvoices(enabled)
  return {
    ...invoices,
    data: invoices.data
      ? (toOutstandingBills(invoices.data) as (OutstandingBill & { patientName?: string })[]).map(
          (bill) => ({
            ...bill,
            patientName: invoices.data?.find((i) => i.id === bill.invoiceId)?.patientName,
          })
        )
      : undefined,
  }
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildInvoiceInput) => createResource(buildInvoice(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  })
}

/**
 * Record a payment against an invoice.
 *
 * Writes a PaymentReconciliation rather than editing the invoice: what was paid
 * is its own fact with its own date, method and payer, and folding it into a
 * running total on the invoice would lose all three.
 */
export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildPaymentInput) => createResource(buildPayment(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      // The invoice's balance is derived from payments, so it changes too.
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
    },
  })
}

export function useSubmitClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildClaimInput) => createResource(buildClaim(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["claims"] }),
  })
}

/**
 * Record an insurer's decision on a claim.
 *
 * The approved amount is whatever the insurer actually granted — it is NOT
 * defaulted to the amount claimed, because a partially approved claim is the
 * normal case and assuming full approval would overstate expected income.
 */
export function useRespondToClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      claimId,
      approved,
      amountApproved,
    }: {
      claimId: string
      approved: boolean
      amountApproved: number
    }) => {
      const claim = await readResource<FhirClaim>("Claim", claimId)
      return createResource(
        buildClaimResponse(claim, approved ? "complete" : "error", approved ? amountApproved : 0)
      )
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["claims"] }),
  })
}

export function useRequestRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildRefundInput) => createResource(buildRefund(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  })
}

export function useSetRefundStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ refundId, status }: { refundId: string; status: RefundStatus }) => {
      // Read-then-write so the amount, reason and invoice link survive.
      const basic = await readResource<Basic>("Basic", refundId)
      return updateResource<Basic>(withRefundStatus(basic, status))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  })
}
