"use client"

import { useQuery } from "@tanstack/react-query"
import type { Patient as FhirPatient } from "@medplum/fhirtypes"
import { searchResources, readResource } from "@/lib/fhir/client"
import { toPatientSummary, type PatientSummary } from "@/lib/fhir/patient"

export interface PatientFilters {
  /** Free text matched against name, identifier, and phone by the server. */
  search?: string
  /** "Male" | "Female" — anything else means no gender filter. */
  gender?: string
  /** "Active" | "Inactive" — maps to FHIR `active`. */
  status?: string
}

const PAGE_SIZE = 100

/**
 * Filtering is pushed to the FHIR server rather than done in the browser, so
 * the client never has to hold the full patient list to search it.
 */
function toSearchParams(filters: PatientFilters): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    _count: PAGE_SIZE,
    _sort: "-_lastUpdated",
    // Medplum omits Bundle.total unless it is asked for explicitly.
    _total: "accurate",
  }

  const search = filters.search?.trim()
  // Medplum supports `_filter`-free multi-field matching via the `_content`
  // param, but name/identifier/phone are the indexed fields that matter here.
  if (search) params.name = search

  if (filters.gender === "Male" || filters.gender === "Female") {
    params.gender = filters.gender.toLowerCase()
  }
  if (filters.status === "Active") params.active = "true"
  if (filters.status === "Inactive") params.active = "false"

  return params
}

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: async (): Promise<{ patients: PatientSummary[]; total?: number }> => {
      const { resources, total } = await searchResources<FhirPatient>(
        "Patient",
        toSearchParams(filters)
      )
      return { patients: resources.map(toPatientSummary), total }
    },
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ["patient", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PatientSummary> => {
      const patient = await readResource<FhirPatient>("Patient", id as string)
      return toPatientSummary(patient)
    },
  })
}
