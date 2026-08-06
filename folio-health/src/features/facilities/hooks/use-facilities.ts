"use client"

import { useQuery } from "@tanstack/react-query"
import type { Organization, Patient } from "@medplum/fhirtypes"
import { readResource, searchResources } from "@/lib/fhir/client"
import { toFacilitySummary, type FacilitySummary } from "@/lib/fhir/organization"

export interface FacilityFilters {
  search?: string
  /** "active" | "inactive" — anything else means no filter. */
  status?: string
}

export function useFacilities(filters: FacilityFilters = {}) {
  return useQuery({
    queryKey: ["facilities", filters],
    queryFn: async (): Promise<{ facilities: FacilitySummary[]; total?: number }> => {
      const search = filters.search?.trim()
      const { resources, total } = await searchResources<Organization>("Organization", {
        _count: 100,
        _sort: "name",
        _total: "accurate",
        // `:contains` — a bare `name=` is a starts-with match in FHIR, so
        // searching "clinic" would miss "BRUNO CLINIC" entirely.
        ...(search ? { "name:contains": search } : {}),
        ...(filters.status === "active"
          ? { active: "true" }
          : filters.status === "inactive"
            ? { active: "false" }
            : {}),
      })
      return { facilities: resources.map(toFacilitySummary), total }
    },
  })
}

export function useFacility(id: string | undefined) {
  return useQuery({
    queryKey: ["facility", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<FacilitySummary> => {
      const organization = await readResource<Organization>("Organization", id as string)
      return toFacilitySummary(organization)
    },
  })
}

/**
 * How much of the record belongs to this facility.
 *
 * Counted with `_summary=count`, so no resource bodies are transferred — the
 * point is the scale of the tenant, not its contents.
 *
 * Patients only. `Practitioner` has no `organization` search parameter in FHIR
 * R4 (the server rejects it outright); the practitioner-to-facility link runs
 * through `PractitionerRole`, and this server currently has zero of those — so
 * a practitioner-per-facility count cannot be derived at all yet. Showing 0
 * would read as "no staff here" rather than "not recorded", so it is omitted.
 */
export function useFacilityFootprint(id: string | undefined) {
  return useQuery({
    queryKey: ["facility-footprint", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<{ patients: number }> => {
      const { total } = await searchResources<Patient>("Patient", {
        organization: `Organization/${id}`,
        _summary: "count",
        _total: "accurate",
        _count: 0,
      })
      return { patients: total ?? 0 }
    },
  })
}
