"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Basic, Medication, Organization } from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { FOLIO_BASIC_SYSTEM } from "@/lib/fhir/custom"
import {
  buildDrug,
  buildPurchaseOrder,
  buildSupplier,
  isSupplier,
  toDrug,
  toPurchaseOrder,
  toSupplier,
  withPurchaseOrderStatus,
  withStockDelta,
  type BuildDrugInput,
  type BuildPurchaseOrderInput,
} from "@/lib/fhir/inventory"
import type { Drug, PurchaseOrder, PurchaseOrderStatus, Supplier } from "@/lib/mock/pharmacy"

/**
 * Pharmacy stock, suppliers and purchase orders from Medplum.
 *
 * Replaces DRUGS / SUPPLIERS / PURCHASE_ORDERS, all empty arrays since the
 * fabricated records were removed.
 */

const PAGE_SIZE = 200

export function useDrugs(enabled = true) {
  return useQuery({
    queryKey: ["drugs"],
    enabled,
    queryFn: async (): Promise<Drug[]> => {
      const { resources } = await searchResources<Medication>("Medication", {
        _count: PAGE_SIZE,
        _sort: "-_lastUpdated",
      })
      return resources.map(toDrug)
    },
  })
}

export function useSuppliers(enabled = true) {
  return useQuery({
    queryKey: ["suppliers"],
    enabled,
    queryFn: async (): Promise<Supplier[]> => {
      const [{ resources: organizations }, { resources: medications }] = await Promise.all([
        searchResources<Organization>("Organization", { _count: PAGE_SIZE, _sort: "name" }),
        searchResources<Medication>("Medication", { _count: PAGE_SIZE }),
      ])

      // itemsSupplied is counted from the drugs that actually name each
      // supplier, so the figure cannot drift from the catalogue.
      const counts = new Map<string, number>()
      for (const medication of medications) {
        const supplierId = toDrug(medication).supplierId
        if (supplierId) counts.set(supplierId, (counts.get(supplierId) ?? 0) + 1)
      }

      // Facilities are Organizations too; only those marked as suppliers belong
      // in this list.
      return organizations
        .filter(isSupplier)
        .map(toSupplier)
        .map((s) => ({ ...s, itemsSupplied: counts.get(s.id) ?? 0 }))
    },
  })
}

export function usePurchaseOrders(enabled = true) {
  return useQuery({
    queryKey: ["purchase-orders"],
    enabled,
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const { resources } = await searchResources<Basic>("Basic", {
        code: `${FOLIO_BASIC_SYSTEM}|purchase-order`,
        _count: PAGE_SIZE,
        _sort: "-_lastUpdated",
      })
      return resources.map(toPurchaseOrder)
    },
  })
}

export function useCreateDrug() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildDrugInput) => createResource(buildDrug(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["drugs"] }),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof buildSupplier>[0]) =>
      createResource(buildSupplier(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

/**
 * Adjust a drug's stock level.
 *
 * Takes a DELTA, not a new total. Read-modify-write on the server's current
 * value means two concurrent dispenses each subtract their own amount; sending
 * absolute totals would let the later write silently undo the earlier one.
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ drugId, delta }: { drugId: string; delta: number }) => {
      const medication = await readResource<Medication>("Medication", drugId)
      return updateResource<Medication>(withStockDelta(medication, delta))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["drugs"] }),
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildPurchaseOrderInput) => createResource(buildPurchaseOrder(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  })
}

/**
 * Advance a purchase order.
 *
 * Marking one Delivered also adds its quantities to stock — that is the whole
 * point of receiving an order, and leaving it as a status change would mean the
 * shelves and the system disagree.
 */
export function useAdvancePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: PurchaseOrderStatus }) => {
      const basic = await readResource<Basic>("Basic", orderId)
      const order = toPurchaseOrder(basic)

      if (status === "Delivered" && order.status !== "Delivered") {
        for (const item of order.items) {
          if (!item.drugId || !item.quantity) continue
          try {
            const medication = await readResource<Medication>("Medication", item.drugId)
            await updateResource<Medication>(withStockDelta(medication, item.quantity))
          } catch {
            // A line naming a drug that no longer exists must not abort the
            // whole delivery; the rest of the order is still received.
            continue
          }
        }
      }

      return updateResource<Basic>(withPurchaseOrderStatus(basic, status))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      queryClient.invalidateQueries({ queryKey: ["drugs"] })
    },
  })
}

/** Activate or deactivate a supplier. */
export function useSetSupplierActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ supplierId, active }: { supplierId: string; active: boolean }) => {
      // Read-then-write so the supplier's contact details and type markers are
      // preserved rather than replaced by a minimal record.
      const organization = await readResource<Organization>("Organization", supplierId)
      return updateResource<Organization>({ ...organization, active })
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}
