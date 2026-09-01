"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Encounter, Patient, Resource } from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  buildErCase,
  closeErCase,
  toErCase,
  withAttendingDoctor,
  withTriageLevel,
  type BuildErCaseInput,
} from "@/lib/fhir/emergency"
import type { ERCase, TriageLevel } from "@/lib/mock/emergency"

/**
 * Emergency department cases from Medplum.
 *
 * Replaces ER_CASES_LIST, an empty array since the fabricated records were
 * removed — so the triage board was blank and triaging a patient changed a
 * local value that vanished on navigation.
 */

const PAGE_SIZE = 200

export interface ErCaseWithPatient extends ERCase {
  patientName?: string
}

/**
 * @param includeClosed pass true for the day's history; the default returns
 *   only patients still in the department, which is what a board means.
 */
export function useErCases(includeClosed = false, enabled = true) {
  return useQuery({
    queryKey: ["er-cases", includeClosed],
    enabled,
    queryFn: async (): Promise<ErCaseWithPatient[]> => {
      const { resources } = await searchResources<Resource>("Encounter", {
        // EMER distinguishes an ED attendance from an inpatient stay or a
        // clinic visit; without it the board would list every encounter.
        class: "EMER",
        ...(includeClosed ? {} : { status: "in-progress" }),
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

      return encounters
        .map(toErCase)
        .map((c) => ({ ...c, patientName: names.get(c.patientId) }))
        // Sickest first, then longest-waiting. A board ordered by arrival alone
        // buries a level-1 patient behind whoever walked in earlier.
        .sort(
          (a, b) =>
            a.triageLevel - b.triageLevel || a.arrivalTime.localeCompare(b.arrivalTime)
        )
    },
  })
}

export function useCreateErCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildErCaseInput) => createResource(buildErCase(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["er-cases"] }),
  })
}

/** Re-triage a waiting patient. */
export function useSetTriageLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, level }: { caseId: string; level: TriageLevel }) => {
      // Read-then-write: re-triage must not revert a clinician assignment or
      // any other concurrent edit to the encounter.
      const encounter = await readResource<Encounter>("Encounter", caseId)
      return updateResource<Encounter>(withTriageLevel(encounter, level))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["er-cases"] }),
  })
}

export function useAssignErDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      caseId,
      doctor,
    }: {
      caseId: string
      doctor: { reference: string; display?: string }
    }) => {
      const encounter = await readResource<Encounter>("Encounter", caseId)
      return updateResource<Encounter>(withAttendingDoctor(encounter, doctor))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["er-cases"] }),
  })
}

/**
 * Close an ED case.
 *
 * `admitted` only records where the patient went. Creating the inpatient
 * encounter is the admissions module's job — doing it here would produce two
 * admissions when the ward also admits them.
 */
export function useCloseErCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, admitted }: { caseId: string; admitted: boolean }) => {
      const encounter = await readResource<Encounter>("Encounter", caseId)
      return updateResource<Encounter>(closeErCase(encounter, admitted))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["er-cases"] }),
  })
}
