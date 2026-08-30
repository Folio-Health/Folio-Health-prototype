"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Encounter, Location, Patient, Resource } from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  buildAdmission,
  buildBed,
  buildWard,
  dischargeEncounter,
  isBed,
  isWard,
  occupiedBedIds,
  toAdmission,
  toBed,
  toWard,
  type BuildAdmissionInput,
} from "@/lib/fhir/admissions"
import type { Admission, Bed, Ward } from "@/lib/mock/admissions"

/**
 * Admissions, wards and beds from Medplum.
 *
 * Replaces ADMISSIONS_LIST / WARDS_LIST / BEDS_LIST, all empty arrays since the
 * fabricated records were removed.
 *
 * NOTE ON EMPTY STATE: a fresh Folio project has no Location resources at all,
 * so there are no wards and no beds until someone creates them. That is why
 * ward and bed creation live here rather than being assumed to exist — without
 * them the admissions module cannot admit anyone.
 */

const PAGE_SIZE = 200

/** Wards and beds in one query — both are Locations, told apart by physicalType. */
export function useWardsAndBeds(enabled = true) {
  return useQuery({
    queryKey: ["wards-and-beds"],
    enabled,
    queryFn: async (): Promise<{ wards: Ward[]; beds: Bed[] }> => {
      const [{ resources: locations }, { resources: encounters }] = await Promise.all([
        searchResources<Location>("Location", { _count: PAGE_SIZE, _sort: "name" }),
        // Occupancy is derived from live encounters, not stored on the bed.
        searchResources<Encounter>("Encounter", {
          status: "in-progress",
          _count: PAGE_SIZE,
        }),
      ])

      const occupied = occupiedBedIds(encounters)
      return {
        wards: locations.filter(isWard).map(toWard),
        beds: locations.filter(isBed).map((l) => toBed(l, occupied)),
      }
    },
  })
}

export interface AdmissionWithPatient extends Admission {
  patientName?: string
}

/**
 * Inpatient admissions.
 *
 * @param includeDischarged pass true for the discharge history; the default
 *   returns only current inpatients, which is what a ward list means.
 */
export function useAdmissions(includeDischarged = false, enabled = true) {
  return useQuery({
    queryKey: ["admissions", includeDischarged],
    enabled,
    queryFn: async (): Promise<AdmissionWithPatient[]> => {
      const { resources } = await searchResources<Resource>("Encounter", {
        // IMP = inpatient. Without this the list would include every outpatient
        // visit and consultation as though they were admissions.
        class: "IMP",
        ...(includeDischarged ? {} : { status: "in-progress" }),
        _count: PAGE_SIZE,
        _sort: "-date",
        _include: "Encounter:subject",
      })

      const encounters = resources.filter((r): r is Encounter => r.resourceType === "Encounter")
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      // The Encounter records the BED; the ward is the bed's parent. Resolved
      // here in one Location fetch rather than one per admission.
      const bedIds = Array.from(
        new Set(encounters.map((e) => toAdmission(e).bedId).filter(Boolean))
      )
      const wardByBed = new Map<string, string>()
      if (bedIds.length > 0) {
        const { resources: beds } = await searchResources<Location>("Location", {
          _id: bedIds.join(","),
          _count: PAGE_SIZE,
        })
        for (const bed of beds) {
          const wardId = bed.partOf?.reference?.split("/")[1]
          if (bed.id && wardId) wardByBed.set(bed.id, wardId)
        }
      }

      return encounters.map((encounter) => {
        const admission = toAdmission(encounter)
        return {
          ...admission,
          wardId: wardByBed.get(admission.bedId) ?? "",
          patientName: names.get(admission.patientId),
        }
      })
    },
  })
}

export function useCreateWard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof buildWard>[0]) => createResource(buildWard(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] }),
  })
}

/**
 * Create beds in a ward.
 *
 * Sequential rather than parallel: Medplum rate-limits bursts, and a ward that
 * half-created its beds is more confusing than one that failed outright and can
 * simply be retried.
 */
export function useCreateBeds() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      wardId,
      labels,
    }: {
      wardId: string
      labels: string[]
    }): Promise<Location[]> => {
      const created: Location[] = []
      for (const label of labels) {
        created.push(await createResource(buildBed({ label, wardId })))
      }
      return created
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] }),
  })
}

export function useAdmitPatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildAdmissionInput) => createResource(buildAdmission(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      // The bed the patient just took is now occupied.
      queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] })
    },
  })
}

/**
 * Discharge: close the encounter AND end the bed occupancy.
 *
 * Read-then-write so a concurrent edit elsewhere on the encounter is not
 * reverted by the discharge.
 */
export function useDischargePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (encounterId: string) => {
      const encounter = await readResource<Encounter>("Encounter", encounterId)
      return updateResource<Encounter>(dischargeEncounter(encounter))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] })
    },
  })
}
