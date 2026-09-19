"use client"

import { useQuery } from "@tanstack/react-query"
import type { Appointment, AuditEvent } from "@medplum/fhirtypes"
import { FhirError, searchResources, type SearchParams } from "@/lib/fhir/client"

/**
 * Dashboard figures, counted by the FHIR server.
 *
 * Every number here is a real `Bundle.total` from a `_summary=count` search.
 * The previous dashboard returned hardcoded literals (128 patients, 24
 * admissions) and generated its chart with `faker.number.int` at *render* time,
 * which produced different values on the server and the client — a guaranteed
 * hydration mismatch that also changed on every re-render.
 */

/** Local-day boundaries as FHIR date params. Uses local time deliberately: a
 *  clinic's "today" is its own calendar day, not UTC's. */
function todayRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function countOf(resourceType: string, params: SearchParams = {}): Promise<number> {
  const { total } = await searchResources(resourceType, {
    ...params,
    _summary: "count",
    _total: "accurate",
    _count: 0,
  })
  return total ?? 0
}

/**
 * A count the signed-in role may not be allowed to make.
 *
 * Each role's AccessPolicy lists only the resource types that role works with —
 * a facility admin's, for instance, has no Encounter, ServiceRequest or
 * Appointment at all, so those searches come back 403 by design. That is not a
 * failure of the dashboard, so it must not take the whole page down with
 * "Could not load dashboard": the figure is simply unavailable (`null`) and
 * the card shows a dash. Every other error still propagates.
 */
async function countIfPermitted(
  resourceType: string,
  params: SearchParams = {}
): Promise<number | null> {
  try {
    return await countOf(resourceType, params)
  } catch (error) {
    if (error instanceof FhirError && error.status === 403) return null
    throw error
  }
}

export interface DashboardMetrics {
  patients: number | null
  appointmentsToday: number | null
  activeEncounters: number | null
  practitioners: number | null
  organizations: number | null
  pendingLabOrders: number | null
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { start, end } = todayRange()
      const [
        patients,
        appointmentsToday,
        activeEncounters,
        practitioners,
        organizations,
        pendingLabOrders,
      ] = await Promise.all([
        countIfPermitted("Patient"),
        // Repeated `date` params — AND, not the OR a comma would produce.
        countIfPermitted("Appointment", { date: [`ge${start}`, `le${end}`] }),
        countIfPermitted("Encounter", { status: "in-progress" }),
        countIfPermitted("Practitioner"),
        countIfPermitted("Organization"),
        countIfPermitted("ServiceRequest", { status: "active" }),
      ])
      return {
        patients,
        appointmentsToday,
        activeEncounters,
        practitioners,
        organizations,
        pendingLabOrders,
      }
    },
  })
}

export interface FacilityAdminMetrics {
  /** Patients registered at this facility (compartment-scoped by the policy). */
  patients: number | null
  /** Audit events recorded today — the admin's view of "what happened". */
  auditEventsToday: number | null
}

/**
 * Figures for the hospital administrator — accounts, roles and infrastructure,
 * "clinical content none" (EMR V1 RBAC spec §7.8). Nothing clinical is
 * requested here at all; the staff-account figures come from the admin plane
 * via `useFacilityStaff`, not from FHIR searches.
 */
export function useFacilityAdminMetrics() {
  return useQuery({
    queryKey: ["facility-admin-metrics"],
    queryFn: async (): Promise<FacilityAdminMetrics> => {
      const { start, end } = todayRange()
      const [patients, auditEventsToday] = await Promise.all([
        countIfPermitted("Patient"),
        countIfPermitted("AuditEvent", { date: [`ge${start}`, `le${end}`] }),
      ])
      return { patients, auditEventsToday }
    },
  })
}

/** Index signature so this satisfies TrendChart's `Record<string, string|number>` rows. */
export interface StatusBreakdown {
  total: number
  active: number
  inactive: number
  /**
   * Records with no `active` field at all. Tracked separately rather than
   * folded into "active": FHIR treats a missing flag as active, but for an
   * admin view "never recorded" and "explicitly enabled" are different facts —
   * and only the first is a data-quality problem worth surfacing.
   */
  unspecified: number
}

export interface PlatformMetrics {
  organizations: number
  practitioners: number
  auditEvents: number
  facilityStatus: StatusBreakdown
  accountStatus: StatusBreakdown
}

async function statusBreakdown(resourceType: string): Promise<StatusBreakdown> {
  const [total, active, inactive] = await Promise.all([
    countOf(resourceType),
    countOf(resourceType, { active: "true" }),
    countOf(resourceType, { active: "false" }),
  ])
  return { total, active, inactive, unspecified: Math.max(0, total - active - inactive) }
}

/**
 * Operator-plane figures only.
 *
 * Organization / Practitioner are directory resources, not patient PHI (see
 * SHARED_READONLY_RESOURCE_TYPES in the access model). No clinical counts are
 * fetched here at all — not hidden in the UI, simply never requested.
 */
export function usePlatformMetrics() {
  return useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async (): Promise<PlatformMetrics> => {
      const [auditEvents, facilityStatus, accountStatus] = await Promise.all([
        countOf("AuditEvent"),
        statusBreakdown("Organization"),
        statusBreakdown("Practitioner"),
      ])
      return {
        organizations: facilityStatus.total,
        practitioners: accountStatus.total,
        auditEvents,
        facilityStatus,
        accountStatus,
      }
    },
  })
}

export type Granularity = "week" | "month"

export interface RegistrationBucket {
  [key: string]: string | number
  period: string
  facilities: number
}

/**
 * Facilities registered per week or per month.
 *
 * Registration time is taken from `meta.lastUpdated`. FHIR has no "created"
 * field, and Medplum's versionId is a UUID rather than a counter — but a
 * resource that has never been edited has exactly one version, so lastUpdated
 * IS its creation time. Spot-checking this server's Organizations found single
 * -version records, so the proxy holds here. A facility edited after onboarding
 * would count in the bucket it was edited in, not the one it was created in.
 *
 * Counted one bucket at a time with `_summary=count` rather than fetching every
 * Organization and grouping in the browser, so it stays correct past one page
 * of results.
 */
export function useFacilityRegistrations(granularity: Granularity) {
  return useQuery({
    queryKey: ["facility-registrations", granularity],
    queryFn: async (): Promise<RegistrationBucket[]> => {
      const now = new Date()
      const periods = granularity === "week" ? 8 : 6

      const ranges: { label: string; start: Date; end: Date }[] = []
      for (let i = periods - 1; i >= 0; i--) {
        const start = new Date(now)
        const end = new Date(now)
        if (granularity === "week") {
          // Week starting Monday, i weeks back.
          const day = (start.getDay() + 6) % 7
          start.setDate(start.getDate() - day - i * 7)
          start.setHours(0, 0, 0, 0)
          end.setTime(start.getTime())
          end.setDate(start.getDate() + 7)
        } else {
          start.setMonth(start.getMonth() - i, 1)
          start.setHours(0, 0, 0, 0)
          end.setTime(start.getTime())
          end.setMonth(start.getMonth() + 1)
        }
        ranges.push({
          label:
            granularity === "week"
              ? start.toLocaleDateString(undefined, { day: "numeric", month: "short" })
              : start.toLocaleDateString(undefined, { month: "short" }),
          start,
          end,
        })
      }

      const counts = await Promise.all(
        ranges.map((range) =>
          countOf("Organization", {
            // Repeated params are AND — a comma would mean OR and match everything.
            _lastUpdated: [`ge${range.start.toISOString()}`, `lt${range.end.toISOString()}`],
          })
        )
      )

      return ranges.map((range, i) => ({ period: range.label, facilities: counts[i] }))
    },
  })
}

export interface DayCount {
  [key: string]: string | number
  day: string
  appointments: number
}

/** Appointment volume for the last 7 local days, bucketed client-side. */
export function useWeeklyAppointments() {
  return useQuery({
    queryKey: ["dashboard-weekly-appointments"],
    queryFn: async (): Promise<DayCount[]> => {
      const now = new Date()
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)

      const { resources } = await searchResources<Appointment>("Appointment", {
        date: `ge${from.toISOString()}`,
        _count: 500,
      })

      const buckets: DayCount[] = []
      const index = new Map<string, number>()
      for (let i = 0; i < 7; i++) {
        const day = new Date(from)
        day.setDate(from.getDate() + i)
        const key = day.toDateString()
        index.set(key, buckets.length)
        buckets.push({
          day: day.toLocaleDateString(undefined, { weekday: "short" }),
          appointments: 0,
        })
      }

      for (const appointment of resources) {
        if (!appointment.start) continue
        const slot = index.get(new Date(appointment.start).toDateString())
        if (slot !== undefined) buckets[slot].appointments += 1
      }
      return buckets
    },
  })
}

export interface ActivityItem {
  id: string
  action: string
  who: string
  when?: string
  outcome?: string
}

/** Recent audit trail — the server records one AuditEvent per data access. */
export function useRecentActivity(limit = 6) {
  return useQuery({
    queryKey: ["dashboard-activity", limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const { resources } = await searchResources<AuditEvent>("AuditEvent", {
        _count: limit,
        _sort: "-_lastUpdated",
      })
      return resources.map((event) => ({
        id: event.id ?? crypto.randomUUID(),
        action:
          event.type?.display ??
          event.subtype?.[0]?.display ??
          event.type?.code ??
          "Activity",
        who: event.agent?.[0]?.who?.display ?? event.agent?.[0]?.name ?? "System",
        when: event.recorded,
        outcome: event.outcome,
      }))
    },
  })
}

/** The next appointments from now onward. */
export function useUpcomingAppointments(limit = 5) {
  return useQuery({
    queryKey: ["dashboard-upcoming", limit],
    queryFn: async (): Promise<Appointment[]> => {
      const { resources } = await searchResources<Appointment>("Appointment", {
        date: `ge${new Date().toISOString()}`,
        _sort: "date",
        _count: limit,
      })
      return resources
    },
  })
}
