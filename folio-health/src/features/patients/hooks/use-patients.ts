"use client"

import { useQuery } from "@tanstack/react-query"
import type { Patient as FhirPatient } from "@medplum/fhirtypes"
import { searchResources, readResource } from "@/lib/fhir/client"
import { toPatientSummary, type PatientSummary } from "@/lib/fhir/patient"
import { NIN_LENGTH, NIN_SYSTEM } from "@/lib/identifiers"

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
  // `:contains`, not a bare `name=`: FHIR string search defaults to
  // starts-with, so searching a surname fragment would silently return nothing.
  if (search) params["name:contains"] = search

  if (filters.gender === "Male" || filters.gender === "Female") {
    params.gender = filters.gender.toLowerCase()
  }
  if (filters.status === "Active") params.active = "true"
  if (filters.status === "Inactive") params.active = "false"

  return params
}

/**
 * @param enabled pass false to skip the request entirely — used so the operator
 *   plane, which may not browse patients, never issues the query at all.
 */
export function usePatients(filters: PatientFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ["patients", filters],
    enabled,
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


/**
 * Front-desk patient lookup, the way a desk actually asks for it: by name,
 * phone number, or NIN — one box.
 *
 *  - 11 digits  → exact NIN identifier match (the strongest signal there is)
 *  - 7+ digits  → phone search
 *  - otherwise  → name fragment (`name:contains`)
 *
 * Results stay scoped to the caller's facility by their own AccessPolicy.
 */
export function usePatientLookup(term: string, enabled = true) {
  const query = term.trim()
  const digits = query.replace(/\D/g, "")
  const isNin = digits.length === NIN_LENGTH && /^\d+$/.test(query.replace(/\s/g, ""))
  const isPhone = !isNin && digits.length >= 7 && digits.length === query.replace(/[\s\-+]/g, "").length

  return useQuery({
    queryKey: ["patient-lookup", query],
    enabled: enabled && query.length >= 2,
    queryFn: async (): Promise<PatientSummary[]> => {
      const params = isNin
        ? { identifier: `${NIN_SYSTEM}|${digits}` }
        : isPhone
          ? { phone: digits }
          : { "name:contains": query }
      const { resources } = await searchResources<FhirPatient>("Patient", {
        ...params,
        _count: 8,
        _sort: "-_lastUpdated",
      })
      return resources.map(toPatientSummary)
    },
  })
}
