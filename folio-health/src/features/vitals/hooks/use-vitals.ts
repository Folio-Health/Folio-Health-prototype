"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Observation, Patient, Resource } from "@medplum/fhirtypes"
import { createResource, searchResources } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import { buildVitalObservations, toVitalReadings } from "@/lib/fhir/vitals"
import type { VitalReading } from "@/types/core"

/**
 * Vitals read from and written to Medplum as FHIR Observations.
 *
 * Replaces `getAllRecentVitals()` from the mock layer, which returned an empty
 * array after the fabricated records were removed — so the Vitals hub rendered
 * a permanently blank table and its "record vitals" form wrote to component
 * state that vanished on navigation.
 */

/**
 * Observations per reading: BP panel, pulse, temperature, respiratory rate,
 * SpO2, weight, height, BMI. Used to translate "rows wanted" into "resources to
 * fetch" so a page of readings is not silently truncated mid-reading.
 */
const OBSERVATIONS_PER_READING = 8

interface UseRecentVitalsOptions {
  /** Limit to one patient. Omit for the cross-patient hub view. */
  patientId?: string
  /** Readings (not Observations) to aim for. */
  limit?: number
  enabled?: boolean
}

export function useRecentVitals({
  patientId,
  limit = 40,
  enabled = true,
}: UseRecentVitalsOptions = {}) {
  return useQuery({
    queryKey: ["vitals", patientId ?? "all", limit],
    enabled,
    queryFn: async (): Promise<VitalReading[]> => {
      const { resources } = await searchResources<Resource>("Observation", {
        category: "vital-signs",
        _count: limit * OBSERVATIONS_PER_READING,
        _sort: "-date",
        // Names come back with the readings in ONE request. Fetching each
        // Patient separately would be a request per row.
        _include: "Observation:subject",
        ...(patientId ? { subject: `Patient/${patientId}` } : {}),
      })

      // `_include` mixes Patients into the same bundle — split them apart.
      const observations = resources.filter(
        (r): r is Observation => r.resourceType === "Observation"
      )
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      // Sorting by date returns Observations, not whole readings, so the last
      // group in the page may be incomplete. Trimming to `limit` readings after
      // reassembly keeps a partially-fetched group out of the table.
      return toVitalReadings(observations, names).slice(0, limit)
    },
  })
}

export interface RecordVitalsInput {
  patientId: string
  bpSystolic: number
  bpDiastolic: number
  pulse: number
  temperature: number
  respiratoryRate: number
  spo2: number
  weight: number
  height: number
  /** Practitioner reference for `performer`, when the signed-in user is known. */
  performer?: { reference: string; display?: string }
}

export function useRecordVitals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordVitalsInput) => {
      const { patientId, performer, ...values } = input
      const observations = buildVitalObservations(values, { patientId, performer })

      // Sequential, not Promise.all: Medplum rate-limits bursts, and a partial
      // failure part-way through a parallel write leaves a half-recorded
      // reading that `toVitalReadings` would show as a row of zeros.
      const created: Observation[] = []
      for (const observation of observations) {
        created.push(await createResource(observation))
      }
      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vitals"] })
    },
  })
}
