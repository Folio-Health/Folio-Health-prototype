"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  AllergyIntolerance,
  Appointment,
  Condition,
  Observation,
  Patient as FhirPatient,
} from "@medplum/fhirtypes"
import { readResource, searchResources, updateResource } from "@/lib/fhir/client"

/**
 * Clinical resources hanging off a patient.
 *
 * The mock data carried allergies, conditions, vitals and the treating doctor
 * as fields on one flat Patient object. In FHIR each is its own resource with
 * its own provenance and status, so each gets its own query — and each can
 * legitimately come back empty, which the UI has to show rather than fake.
 */

export function usePatientAllergies(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-allergies", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { resources } = await searchResources<AllergyIntolerance>("AllergyIntolerance", {
        patient: `Patient/${patientId}`,
        _count: 50,
      })
      return resources
    },
  })
}

export function usePatientConditions(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-conditions", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { resources } = await searchResources<Condition>("Condition", {
        patient: `Patient/${patientId}`,
        _count: 50,
      })
      return resources
    },
  })
}

export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-appointments", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { resources } = await searchResources<Appointment>("Appointment", {
        patient: `Patient/${patientId}`,
        _count: 50,
        _sort: "-date",
      })
      return resources
    },
  })
}

/** Vital-sign observations, oldest first so they chart left-to-right. */
export function usePatientVitals(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-vitals", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { resources } = await searchResources<Observation>("Observation", {
        patient: `Patient/${patientId}`,
        category: "vital-signs",
        _count: 100,
        _sort: "date",
      })
      return resources
    },
  })
}

export interface PatientEdit {
  name: string
  phone: string
  email: string
}

/**
 * Writes demographic edits back to the FHIR server.
 *
 * Reads the current resource first and patches only the fields the form owns,
 * so concurrent changes to other fields are not clobbered by a stale copy held
 * in component state.
 */
export function useUpdatePatient(patientId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (edit: PatientEdit) => {
      if (!patientId) throw new Error("No patient id")
      const current = await readResource<FhirPatient>("Patient", patientId)

      const trimmed = edit.name.trim()
      const parts = trimmed.split(/\s+/)
      const family = parts.length > 1 ? parts[parts.length - 1] : undefined
      const given = parts.length > 1 ? parts.slice(0, -1) : parts

      const telecom = [
        ...(edit.phone.trim() ? [{ system: "phone" as const, value: edit.phone.trim() }] : []),
        ...(edit.email.trim() ? [{ system: "email" as const, value: edit.email.trim() }] : []),
        // Preserve contact points this form does not manage (fax, url, ...).
        ...(current.telecom ?? []).filter((t) => t.system !== "phone" && t.system !== "email"),
      ]

      return updateResource<FhirPatient>({
        ...current,
        name: trimmed ? [{ given, family, text: trimmed }] : current.name,
        telecom,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patient", patientId] })
      void queryClient.invalidateQueries({ queryKey: ["patients"] })
    },
  })
}
