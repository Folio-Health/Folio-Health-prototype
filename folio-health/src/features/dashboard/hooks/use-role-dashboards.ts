"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  Claim,
  Encounter,
  MedicationRequest,
  Resource,
  ServiceRequest,
} from "@medplum/fhirtypes"
import { FhirError, searchResources, type SearchParams } from "@/lib/fhir/client"

/**
 * Real, policy-aware data for the per-role dashboards.
 *
 * Every figure and list here is fetched from the FHIR server; nothing is
 * invented. Two kinds of honesty apply:
 *
 *   - `null` — this role's AccessPolicy does not grant the resource (the
 *     search came back 403). The dashboard renders a dash / "not available
 *     for your role", never a made-up number.
 *   - `[]` / `0` — the server really holds nothing yet. The dashboard shows
 *     an empty state.
 *
 * Anything with no real data model behind it at all (bed assignments, stock
 * levels, waiting-room queues) is NOT fetched or simulated — the dashboards
 * label those panels as not wired up yet.
 */

function todayRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function countIfPermitted(
  resourceType: string,
  params: SearchParams = {}
): Promise<number | null> {
  try {
    const { total } = await searchResources(resourceType, {
      ...params,
      _summary: "count",
      _total: "accurate",
      _count: 0,
    })
    return total ?? 0
  } catch (error) {
    if (error instanceof FhirError && error.status === 403) return null
    throw error
  }
}

async function searchIfPermitted<T extends Resource>(
  resourceType: string,
  params: SearchParams = {}
): Promise<T[] | null> {
  try {
    const { resources } = await searchResources<T>(resourceType, params)
    return resources
  } catch (error) {
    if (error instanceof FhirError && error.status === 403) return null
    throw error
  }
}

// ── Doctor ───────────────────────────────────────────────────────────────────

export interface DoctorDashboardData {
  patients: number | null
  activeEncounters: number | null
  pendingLabOrders: number | null
  activePrescriptions: number | null
  /** In-progress encounters, most recent first. `null` when not permitted. */
  encounters: Encounter[] | null
}

export function useDoctorDashboard() {
  return useQuery({
    queryKey: ["doctor-dashboard"],
    queryFn: async (): Promise<DoctorDashboardData> => {
      const [patients, activeEncounters, pendingLabOrders, activePrescriptions, encounters] =
        await Promise.all([
          countIfPermitted("Patient"),
          countIfPermitted("Encounter", { status: "in-progress" }),
          countIfPermitted("ServiceRequest", { status: "active" }),
          countIfPermitted("MedicationRequest", { status: "active" }),
          searchIfPermitted<Encounter>("Encounter", {
            status: "in-progress",
            _sort: "-_lastUpdated",
            _count: 6,
          }),
        ])
      return { patients, activeEncounters, pendingLabOrders, activePrescriptions, encounters }
    },
  })
}

// ── Nurse ────────────────────────────────────────────────────────────────────

export interface NurseDashboardData {
  patients: number | null
  activeEncounters: number | null
  activeMedications: number | null
  vitalsToday: number | null
  encounters: Encounter[] | null
  medications: MedicationRequest[] | null
}

export function useNurseDashboard() {
  return useQuery({
    queryKey: ["nurse-dashboard"],
    queryFn: async (): Promise<NurseDashboardData> => {
      const { start } = todayRange()
      const [patients, activeEncounters, activeMedications, vitalsToday, encounters, medications] =
        await Promise.all([
          countIfPermitted("Patient"),
          countIfPermitted("Encounter", { status: "in-progress" }),
          countIfPermitted("MedicationRequest", { status: "active" }),
          countIfPermitted("Observation", { date: `ge${start}` }),
          searchIfPermitted<Encounter>("Encounter", {
            status: "in-progress",
            _sort: "-_lastUpdated",
            _count: 5,
          }),
          searchIfPermitted<MedicationRequest>("MedicationRequest", {
            status: "active",
            _sort: "-_lastUpdated",
            _count: 4,
          }),
        ])
      return { patients, activeEncounters, activeMedications, vitalsToday, encounters, medications }
    },
  })
}

// ── Front desk ───────────────────────────────────────────────────────────────

export interface FrontDeskDashboardData {
  patients: number | null
  /**
   * Patients whose record was created or last edited today. FHIR has no
   * "created" search, so `_lastUpdated` is the closest true statement — the
   * card is labelled accordingly.
   */
  patientsTouchedToday: number | null
  practitioners: number | null
  appointmentsToday: number | null
}

export function useFrontDeskDashboard() {
  return useQuery({
    queryKey: ["front-desk-dashboard"],
    queryFn: async (): Promise<FrontDeskDashboardData> => {
      const { start, end } = todayRange()
      const [patients, patientsTouchedToday, practitioners, appointmentsToday] = await Promise.all([
        countIfPermitted("Patient"),
        countIfPermitted("Patient", { _lastUpdated: `ge${start}` }),
        countIfPermitted("Practitioner"),
        countIfPermitted("Appointment", { date: [`ge${start}`, `le${end}`] }),
      ])
      return { patients, patientsTouchedToday, practitioners, appointmentsToday }
    },
  })
}

// ── Laboratory ───────────────────────────────────────────────────────────────

export interface LabDashboardData {
  pendingOrders: number | null
  reportsToday: number | null
  reportsTotal: number | null
  orders: ServiceRequest[] | null
}

export function useLabDashboard() {
  return useQuery({
    queryKey: ["lab-dashboard"],
    queryFn: async (): Promise<LabDashboardData> => {
      const { start } = todayRange()
      const [pendingOrders, reportsToday, reportsTotal, orders] = await Promise.all([
        countIfPermitted("ServiceRequest", { status: "active" }),
        countIfPermitted("DiagnosticReport", { issued: `ge${start}` }),
        countIfPermitted("DiagnosticReport"),
        searchIfPermitted<ServiceRequest>("ServiceRequest", {
          status: "active",
          _sort: "-_lastUpdated",
          _count: 6,
        }),
      ])
      return { pendingOrders, reportsToday, reportsTotal, orders }
    },
  })
}

// ── Pharmacy ─────────────────────────────────────────────────────────────────

export interface PharmacyDashboardData {
  toDispense: number | null
  dispensedToday: number | null
  dispensedTotal: number | null
  prescriptions: MedicationRequest[] | null
}

export function usePharmacyDashboard() {
  return useQuery({
    queryKey: ["pharmacy-dashboard"],
    queryFn: async (): Promise<PharmacyDashboardData> => {
      const { start } = todayRange()
      const [toDispense, dispensedToday, dispensedTotal, prescriptions] = await Promise.all([
        countIfPermitted("MedicationRequest", { status: "active" }),
        countIfPermitted("MedicationDispense", { whenhandedover: `ge${start}` }),
        countIfPermitted("MedicationDispense"),
        searchIfPermitted<MedicationRequest>("MedicationRequest", {
          status: "active",
          _sort: "-_lastUpdated",
          _count: 6,
        }),
      ])
      return { toDispense, dispensedToday, dispensedTotal, prescriptions }
    },
  })
}

// ── Billing ──────────────────────────────────────────────────────────────────

export interface BillingDashboardData {
  claims: number | null
  claimsActive: number | null
  coverage: number | null
  recentClaims: Claim[] | null
}

export function useBillingDashboard() {
  return useQuery({
    queryKey: ["billing-dashboard"],
    queryFn: async (): Promise<BillingDashboardData> => {
      const [claims, claimsActive, coverage, recentClaims] = await Promise.all([
        countIfPermitted("Claim"),
        countIfPermitted("Claim", { status: "active" }),
        countIfPermitted("Coverage"),
        searchIfPermitted<Claim>("Claim", { _sort: "-_lastUpdated", _count: 5 }),
      ])
      return { claims, claimsActive, coverage, recentClaims }
    },
  })
}

// ── Shared display helpers ───────────────────────────────────────────────────

/** A human-readable label for a resource's subject/patient reference. */
export function subjectLabel(
  resource: { subject?: { display?: string; reference?: string } } | undefined
): string {
  return resource?.subject?.display ?? resource?.subject?.reference ?? "Unknown patient"
}

/** A human-readable label for what was ordered/prescribed. */
export function codeLabel(
  resource:
    | { code?: { text?: string; coding?: { display?: string; code?: string }[] } }
    | { medicationCodeableConcept?: { text?: string; coding?: { display?: string; code?: string }[] } }
    | undefined
): string {
  const concept =
    (resource as { code?: { text?: string; coding?: { display?: string; code?: string }[] } })
      ?.code ??
    (
      resource as {
        medicationCodeableConcept?: { text?: string; coding?: { display?: string; code?: string }[] }
      }
    )?.medicationCodeableConcept
  return concept?.text ?? concept?.coding?.[0]?.display ?? concept?.coding?.[0]?.code ?? "Unspecified"
}
