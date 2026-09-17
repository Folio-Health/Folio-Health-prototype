"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  AllergyIntolerance,
  Composition,
  Condition,
  DiagnosticReport,
  Encounter,
  MedicationDispense,
  MedicationRequest,
  Observation,
  Resource,
  ServiceRequest,
} from "@medplum/fhirtypes"
import { FhirError, searchResources } from "@/lib/fhir/client"
import type { EncounterAction } from "@/lib/clinical/encounter"
import type { VitalValues } from "@/lib/clinical/vitals"

/**
 * Data layer for the clinical module.
 *
 * READS are direct FHIR searches under the signed-in user's own facility-
 * scoped policy; a 403 (type not granted to this role) resolves to `null`
 * so screens render "not available" instead of breaking. WRITES all go
 * through the /api/* routes, which own the workflow rules.
 */

async function searchOrNull<T extends Resource>(
  type: string,
  params: Record<string, string | number | (string | number)[] | undefined>
): Promise<T[] | null> {
  try {
    const { resources } = await searchResources<T>(type, params)
    return resources
  } catch (error) {
    if (error instanceof FhirError && error.status === 403) return null
    throw error
  }
}

function dayRange(day: Date) {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(day)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Visits opened on a given day, in arrival order. */
export function useEncountersForDay(day: Date) {
  const { start, end } = dayRange(day)
  return useQuery({
    queryKey: ["encounters", start],
    queryFn: () =>
      searchOrNull<Encounter>("Encounter", {
        date: [`ge${start}`, `le${end}`],
        _sort: "date",
        _count: 200,
      }),
    refetchInterval: 30_000,
  })
}

export function useEncounter(id: string | undefined) {
  return useQuery({
    queryKey: ["encounter", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const found = await searchOrNull<Encounter>("Encounter", { _id: id as string, _count: 1 })
      return found?.[0] ?? null
    },
  })
}

export function useEncounterVitals(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter-vitals", encounterId],
    enabled: Boolean(encounterId),
    queryFn: () =>
      searchOrNull<Observation>("Observation", {
        encounter: `Encounter/${encounterId}`,
        category: "vital-signs",
        _sort: "-date",
        _count: 50,
      }),
  })
}

export function useEncounterNote(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter-note", encounterId],
    enabled: Boolean(encounterId),
    queryFn: async () => {
      const found = await searchOrNull<Composition>("Composition", {
        encounter: `Encounter/${encounterId}`,
        _sort: "-date",
        _count: 1,
      })
      return found === null ? null : (found[0] ?? undefined)
    },
  })
}

export function useEncounterOrders(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter-orders", encounterId],
    enabled: Boolean(encounterId),
    queryFn: () =>
      searchOrNull<ServiceRequest>("ServiceRequest", {
        encounter: `Encounter/${encounterId}`,
        _sort: "-authored",
        _count: 50,
      }),
  })
}

export function useEncounterPrescriptions(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter-prescriptions", encounterId],
    enabled: Boolean(encounterId),
    queryFn: () =>
      searchOrNull<MedicationRequest>("MedicationRequest", {
        encounter: `Encounter/${encounterId}`,
        _sort: "-authoredon",
        _count: 50,
      }),
  })
}

export function useEncounterReports(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter-reports", encounterId],
    enabled: Boolean(encounterId),
    queryFn: () =>
      searchOrNull<DiagnosticReport>("DiagnosticReport", {
        encounter: `Encounter/${encounterId}`,
        _sort: "-issued",
        _count: 50,
      }),
    refetchInterval: 30_000,
  })
}

export function useEncounterDiagnoses(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter-diagnoses", encounterId],
    enabled: Boolean(encounterId),
    queryFn: () =>
      searchOrNull<Condition>("Condition", { encounter: `Encounter/${encounterId}`, _count: 20 }),
  })
}

/** Everything a pharmacist needs to see before dispensing. */
export function usePatientMedicationHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: ["medication-history", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const [requests, dispenses, allergies] = await Promise.all([
        searchOrNull<MedicationRequest>("MedicationRequest", { patient: `Patient/${patientId}`, _sort: "-authoredon", _count: 100 }),
        searchOrNull<MedicationDispense>("MedicationDispense", { patient: `Patient/${patientId}`, _sort: "-whenhandedover", _count: 100 }),
        searchOrNull<AllergyIntolerance>("AllergyIntolerance", { patient: `Patient/${patientId}`, _count: 50 }),
      ])
      return { requests, dispenses, allergies }
    },
  })
}

export const LAB_CATEGORY = "108252007"
export const IMAGING_CATEGORY = "363679005"

/** The performing unit's queue: active orders of one category, oldest first. */
export function useOrderQueue(category: string, status: "active" | "completed" = "active") {
  return useQuery({
    queryKey: ["order-queue", category, status],
    queryFn: () =>
      searchOrNull<ServiceRequest>("ServiceRequest", {
        status,
        category,
        _sort: status === "active" ? "authored" : "-authored",
        _count: 100,
      }),
    refetchInterval: 30_000,
  })
}

export function useReportsForOrders(orderIds: string[]) {
  return useQuery({
    queryKey: ["reports-for-orders", orderIds.join(",")],
    enabled: orderIds.length > 0,
    queryFn: () =>
      searchOrNull<DiagnosticReport>("DiagnosticReport", {
        "based-on": orderIds.map((id) => `ServiceRequest/${id}`).join(","),
        _count: 100,
      }),
  })
}

/** The pharmacy queue: active prescriptions, oldest first. */
export function usePrescriptionQueue() {
  return useQuery({
    queryKey: ["prescription-queue"],
    queryFn: () =>
      searchOrNull<MedicationRequest>("MedicationRequest", {
        status: "active",
        _sort: "authoredon",
        _count: 100,
      }),
    refetchInterval: 30_000,
  })
}

// ── Writes ───────────────────────────────────────────────────────────────────

async function call(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error ?? "The request failed.")
  return payload
}

function useInvalidating<TInput>(fn: (input: TInput) => Promise<unknown>, keys: string[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of keys) void queryClient.invalidateQueries({ queryKey: [key] })
    },
  })
}

export function useOpenEncounter() {
  return useInvalidating(
    (input: { patientId: string; reason?: string }) => call("/api/encounters", "POST", input),
    ["encounters"]
  )
}

export function useEncounterAction() {
  return useInvalidating(
    (input: { id: string; action: EncounterAction; reason?: string }) =>
      call(`/api/encounters/${encodeURIComponent(input.id)}`, "PATCH", { action: input.action, reason: input.reason }),
    ["encounters", "encounter"]
  )
}

export function useRecordVitals() {
  return useInvalidating(
    (input: { encounterId: string; values: VitalValues }) => call("/api/vitals", "POST", input),
    ["encounters", "encounter", "encounter-vitals"]
  )
}

export function useCreateClinical() {
  return useInvalidating(
    (resource: Resource) => call("/api/clinical", "POST", { resource }),
    ["encounter-note", "encounter-orders", "encounter-prescriptions", "encounter-diagnoses", "order-queue", "prescription-queue"]
  )
}

export function usePatchClinical() {
  return useInvalidating(
    (input: { type: string; id: string; action: string; section?: Composition["section"]; reason?: string }) =>
      call(`/api/clinical/${input.type}/${encodeURIComponent(input.id)}`, "PATCH", {
        action: input.action,
        section: input.section,
        reason: input.reason,
      }),
    ["encounter-note", "encounter-orders", "encounter-prescriptions", "order-queue", "prescription-queue"]
  )
}

export function usePostResult() {
  return useInvalidating(
    (input: {
      serviceRequestId: string
      observations: { name: string; value: string; unit?: string; flag?: string }[]
      conclusion?: string
      status?: "preliminary" | "final"
    }) => call("/api/results", "POST", input),
    ["order-queue", "reports-for-orders", "encounter-reports", "encounter-orders"]
  )
}

export function useDispense() {
  return useInvalidating(
    (input: { medicationRequestId: string; quantity?: number; note?: string }) => call("/api/dispense", "POST", input),
    ["prescription-queue", "medication-history", "encounter-prescriptions"]
  )
}
