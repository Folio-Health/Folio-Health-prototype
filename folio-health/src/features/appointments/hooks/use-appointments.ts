"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Appointment, Practitioner } from "@medplum/fhirtypes"
import { FhirError, searchResources } from "@/lib/fhir/client"
import { FOLIO_ROLE_SYSTEM } from "@/lib/auth/roles"
import type { AppointmentAction } from "@/lib/appointments/logic"

/**
 * Appointments data layer.
 *
 * READS go straight to FHIR under the signed-in user's own AccessPolicy
 * (facility-scoped, read-only). WRITES go through /api/appointments, where
 * the booking rules and the state machine are enforced server-side — the UI
 * only ever *requests* a transition; it never applies one.
 */

function dayRange(day: Date): { start: string; end: string } {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(day)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useAppointmentsForDay(day: Date) {
  const { start, end } = dayRange(day)
  return useQuery({
    queryKey: ["appointments", start],
    queryFn: async (): Promise<Appointment[] | null> => {
      try {
        const { resources } = await searchResources<Appointment>("Appointment", {
          date: [`ge${start}`, `le${end}`],
          _sort: "date",
          _count: 200,
        })
        return resources
      } catch (error) {
        // A role whose policy has no Appointment grant sees "not available",
        // not a broken page.
        if (error instanceof FhirError && error.status === 403) return null
        throw error
      }
    },
  })
}

/** Practitioners bookable as the appointment's provider (role-tagged doctors). */
export function useBookablePractitioners() {
  return useQuery({
    queryKey: ["bookable-practitioners"],
    queryFn: async (): Promise<Practitioner[]> => {
      const { resources } = await searchResources<Practitioner>("Practitioner", {
        identifier: `${FOLIO_ROLE_SYSTEM}|doctor`,
        _count: 100,
      })
      return resources.filter((p) => p.active !== false)
    },
  })
}

export interface BookAppointmentInput {
  patientId: string
  patientDisplay?: string
  practitionerId: string
  practitionerDisplay?: string
  start: string
  end: string
  reason?: string
  /** Set when this booking replaces an existing appointment (reschedule). */
  rescheduleOf?: string
}

async function postJson(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error ?? "The request failed.")
  return payload
}

export function useBookAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BookAppointmentInput) => postJson("/api/appointments", "POST", input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  })
}

export function useAppointmentAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string
      action: AppointmentAction
      reason?: string
    }) => postJson(`/api/appointments/${encodeURIComponent(id)}`, "PATCH", { action, reason }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  })
}
