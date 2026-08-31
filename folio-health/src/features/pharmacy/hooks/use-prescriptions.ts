"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { MedicationRequest, Patient, Resource } from "@medplum/fhirtypes"
import { createResource, searchResources, updateResource } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  PRESCRIPTION_GROUP_SYSTEM,
  buildDispense,
  buildPrescription,
  toPrescriptions,
  type BuildPrescriptionInput,
} from "@/lib/fhir/pharmacy"
import type { Prescription } from "@/lib/mock/pharmacy"

/**
 * Prescriptions from Medplum.
 *
 * Replaces PRESCRIPTIONS, an empty array since the fabricated records were
 * removed — so the dispensing queue was blank and marking something dispensed
 * changed a local flag that vanished on navigation.
 */

/** Lines per prescription, used to translate "rows wanted" into "resources". */
const LINES_PER_PRESCRIPTION = 4
const PAGE_SIZE = 200

export interface PrescriptionWithPatient extends Prescription {
  patientName?: string
}

export function usePrescriptions(limit = 50, enabled = true) {
  return useQuery({
    queryKey: ["prescriptions", limit],
    enabled,
    queryFn: async (): Promise<PrescriptionWithPatient[]> => {
      const { resources } = await searchResources<Resource>("MedicationRequest", {
        _count: Math.min(limit * LINES_PER_PRESCRIPTION, PAGE_SIZE),
        _sort: "-authoredon",
        _include: "MedicationRequest:subject",
      })

      const requests = resources.filter(
        (r): r is MedicationRequest => r.resourceType === "MedicationRequest"
      )
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      // Sorting returns individual lines, so the last group in a page may be
      // incomplete. Trimming after reassembly keeps a half-fetched
      // prescription — which would look like a drug was dropped — out of the list.
      return toPrescriptions(requests)
        .slice(0, limit)
        .map((p) => ({ ...p, patientName: names.get(p.patientId) }))
    },
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BuildPrescriptionInput) => {
      const requests = buildPrescription(input)
      // Sequential: Medplum rate-limits bursts, and a partially written
      // prescription reassembles as one missing a drug, which is worse than a
      // clean failure the prescriber can retry.
      const created: MedicationRequest[] = []
      for (const request of requests) {
        created.push(await createResource(request))
      }
      return created
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["prescriptions"] }),
  })
}

/**
 * Dispense every line of a prescription.
 *
 * Writes a MedicationDispense per line AND completes the request. The dispense
 * is what records that the pharmacy actually handed the drug over; completing
 * the request alone would leave no evidence of what was given, or how much.
 */
export function useDispensePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      prescriptionId,
      performer,
    }: {
      prescriptionId: string
      performer?: { reference: string; display?: string }
    }) => {
      const { resources: requests } = await searchResources<MedicationRequest>(
        "MedicationRequest",
        { identifier: `${PRESCRIPTION_GROUP_SYSTEM}|${prescriptionId}`, _count: 50 }
      )
      if (requests.length === 0) {
        throw new Error("This prescription no longer exists.")
      }

      for (const request of requests) {
        // Skip lines already dealt with, so re-dispensing cannot double-issue
        // a drug that was cancelled or handed over earlier.
        if (request.status !== "active") continue
        await createResource(buildDispense(request, { performer }))
        await updateResource<MedicationRequest>({ ...request, status: "completed" })
      }
      return requests.length
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["prescriptions"] }),
  })
}

/** Cancel every still-active line of a prescription. */
export function useCancelPrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (prescriptionId: string) => {
      const { resources: requests } = await searchResources<MedicationRequest>(
        "MedicationRequest",
        { identifier: `${PRESCRIPTION_GROUP_SYSTEM}|${prescriptionId}`, _count: 50 }
      )
      for (const request of requests) {
        // A dispensed line stays dispensed: the drug has physically left the
        // pharmacy and cancelling the record would not bring it back.
        if (request.status !== "active") continue
        await updateResource<MedicationRequest>({ ...request, status: "cancelled" })
      }
      return requests.length
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["prescriptions"] }),
  })
}
