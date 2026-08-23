"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Appointment } from "@medplum/fhirtypes"
import { FhirError, searchResources } from "@/lib/fhir/client"
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

export interface BookablePractitioner {
  id: string
  name: string
}

/**
 * The doctors bookable at the caller's OWN facility, by name. Resolved
 * server-side (/api/practitioners/bookable): the facility binding lives on
 * the ProjectMembership, which the browser cannot read — a plain Practitioner
 * search would list every facility's doctors.
 */
export function useBookablePractitioners() {
  return useQuery({
    queryKey: ["bookable-practitioners"],
    queryFn: async (): Promise<BookablePractitioner[]> => {
      const response = await fetch("/api/practitioners/bookable")
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error ?? "Could not load doctors.")
      return body.practitioners ?? []
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
