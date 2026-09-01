"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Basic, Encounter, Patient, Resource } from "@medplum/fhirtypes"
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
import { FOLIO_BASIC_SYSTEM } from "@/lib/fhir/custom"
import {
  buildAmbulanceDispatch,
  toAmbulanceDispatch,
  withDispatchStatus,
  type BuildDispatchInput,
} from "@/lib/fhir/ambulance"
import type {
  AmbulanceDispatch,
  AmbulanceStatus,
  ERCase,
  TriageLevel,
} from "@/lib/mock/emergency"

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

// -- Ambulance dispatch ------------------------------------------------------

/**
 * Ambulance dispatches, stored as Basic records (see lib/fhir/ambulance.ts).
 *
 * Kept in this module rather than its own because the ED board reads dispatches
 * and cases side by side; splitting them would mean two hooks whose loading
 * states have to be reconciled in every consumer.
 */
export function useAmbulanceDispatches(enabled = true) {
  return useQuery({
    queryKey: ["ambulance-dispatches"],
    enabled,
    queryFn: async (): Promise<AmbulanceDispatch[]> => {
      const { resources } = await searchResources<Basic>("Basic", {
        code: `${FOLIO_BASIC_SYSTEM}|ambulance-dispatch`,
        _count: PAGE_SIZE,
        _sort: "-_lastUpdated",
      })
      return resources.map(toAmbulanceDispatch)
    },
  })
}

export function useCreateDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildDispatchInput) => createResource(buildAmbulanceDispatch(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["ambulance-dispatches"] }),
  })
}

export function useUpdateDispatchStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dispatchId,
      status,
      etaMinutes,
    }: {
      dispatchId: string
      status: AmbulanceStatus
      etaMinutes?: number
    }) => {
      // Read-then-write so crew, destination and patient survive a status change.
      const basic = await readResource<Basic>("Basic", dispatchId)
      return updateResource<Basic>(withDispatchStatus(basic, status, etaMinutes))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["ambulance-dispatches"] }),
  })
}
