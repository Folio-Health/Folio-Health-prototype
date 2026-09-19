import "server-only"

import type { Appointment, Encounter } from "@medplum/fhirtypes"
import type { FacilityBinding } from "@/lib/auth/facility-binding"
import { AMBULATORY_CLASS } from "@/lib/clinical/encounter"
import { privilegedSearch, stampedCreate, stampedUpdate } from "./clinical"

/**
 * Opening and closing visits (Encounters) from the front-office side.
 *
 * Check-in is the join between the administrative Appointment and the
 * clinical Encounter (docs/research/emr-front-office.md §3): marking the
 * patient arrived opens the visit at status `arrived`, which is what the
 * triage board lists. Undoing a mis-clicked check-in cancels a visit that
 * nothing clinical has touched yet.
 */

export async function findEncounterForAppointment(appointmentId: string): Promise<Encounter | undefined> {
  const found = await privilegedSearch<Encounter>(
    `Encounter?appointment=Appointment/${encodeURIComponent(appointmentId)}&_count=5`
  )
  return found.find((e) => e.status !== "cancelled" && e.status !== "entered-in-error")
}

export async function openEncounter(
  input: {
    patientRef: string
    patientDisplay?: string
    appointment?: Appointment
    practitionerRef?: string
    practitionerDisplay?: string
    reason?: string
  },
  facility: FacilityBinding
): Promise<Encounter> {
  const practitioner =
    input.practitionerRef ??
    input.appointment?.participant?.find((p) => p.actor?.reference?.startsWith("Practitioner/"))?.actor?.reference
  const practitionerDisplay =
    input.practitionerDisplay ??
    input.appointment?.participant?.find((p) => p.actor?.reference?.startsWith("Practitioner/"))?.actor?.display

  return stampedCreate<Encounter>(
    {
      resourceType: "Encounter",
      status: "arrived",
      class: AMBULATORY_CLASS,
      subject: { reference: input.patientRef, display: input.patientDisplay },
      ...(input.appointment?.id ? { appointment: [{ reference: `Appointment/${input.appointment.id}` }] } : {}),
      ...(practitioner
        ? {
            participant: [
              {
                type: [
                  {
                    coding: [
                      {
                        system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                        code: "ATND",
                        display: "attender",
                      },
                    ],
                  },
                ],
                individual: { reference: practitioner, display: practitionerDisplay },
              },
            ],
          }
        : {}),
      ...(input.reason ?? input.appointment?.description
        ? { reasonCode: [{ text: (input.reason ?? input.appointment?.description) as string }] }
        : {}),
      period: { start: new Date().toISOString() },
      serviceProvider: { reference: facility.reference, display: facility.display },
      statusHistory: [{ status: "arrived", period: { start: new Date().toISOString() } }],
    },
    facility
  )
}

/** Cancel a visit nothing clinical has touched (undo check-in). */
export async function cancelUntouchedEncounter(encounter: Encounter, facility: FacilityBinding): Promise<void> {
  if (encounter.status !== "arrived") return
  await stampedUpdate<Encounter>(
    `Encounter/${encounter.id}`,
    (existing) => ({
      ...existing,
      status: "cancelled",
      period: { ...existing.period, end: new Date().toISOString() },
    }),
    facility
  )
}
