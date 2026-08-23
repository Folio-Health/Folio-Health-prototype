import type { Appointment } from "@medplum/fhirtypes"

/**
 * Appointment working logic — shared by the server routes (which ENFORCE it)
 * and the UI (which renders only the actions the state machine allows).
 *
 * Modeled on how production EMRs run scheduling (docs/research/
 * emr-front-office.md): the appointment is the ADMINISTRATIVE record
 * (booked → arrived → fulfilled), separate from the clinical Encounter;
 * no-show is an explicit human decision, never a timeout; a reschedule is
 * cancel + rebook with linkage, never an in-place time edit; administrative
 * transitions get an undo, terminal states do not.
 *
 * V1 books against a conflict check (same practitioner, overlapping time)
 * rather than Schedule/Slot templates — the state machine is unchanged when
 * slots arrive later.
 */

/** The subset of FHIR Appointment.status this module uses. */
export type AppointmentStatus = "booked" | "arrived" | "fulfilled" | "cancelled" | "noshow"

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "booked",
  "arrived",
  "fulfilled",
  "cancelled",
  "noshow",
]

/** Actions a user can take on an appointment. */
export type AppointmentAction =
  | "check-in" //   booked   → arrived    (patient is here)
  | "undo-check-in" // arrived → booked   (front-desk mis-click — admin undo)
  | "fulfill" //    arrived  → fulfilled  (visit happened)
  | "cancel" //     booked | arrived → cancelled (with a reason)
  | "no-show" //    booked   → noshow     (explicit decision, after the fact)

/**
 * The single source of truth for what may follow what. Terminal states
 * (fulfilled, cancelled, noshow) allow nothing — corrections to a terminal
 * state are a data-correction workflow, not a routine action.
 */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentAction, { from: AppointmentStatus[]; to: AppointmentStatus }> = {
  "check-in": { from: ["booked"], to: "arrived" },
  "undo-check-in": { from: ["arrived"], to: "booked" },
  fulfill: { from: ["arrived"], to: "fulfilled" },
  cancel: { from: ["booked", "arrived"], to: "cancelled" },
  "no-show": { from: ["booked"], to: "noshow" },
}

export function allowedActions(status: AppointmentStatus): AppointmentAction[] {
  return (Object.keys(APPOINTMENT_TRANSITIONS) as AppointmentAction[]).filter((action) =>
    APPOINTMENT_TRANSITIONS[action].from.includes(status)
  )
}

export function isAppointmentAction(value: string): value is AppointmentAction {
  return value in APPOINTMENT_TRANSITIONS
}

/** Cancellation must say why — the reasons the front desk actually uses. */
export const CANCEL_REASONS = [
  "Patient request",
  "Provider unavailable",
  "Rescheduled",
  "Facility issue",
  "Other",
] as const

/**
 * Marks the replacement appointment created by a reschedule. R4 Appointment
 * has no `replaces` element (R5 adds it), so the link is carried as an
 * extension pointing at the cancelled original.
 */
export const RESCHEDULE_OF_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/reschedule-of"

/** Reads the patient participant off an appointment. */
export function appointmentPatient(appointment: Appointment) {
  return appointment.participant?.find((p) => p.actor?.reference?.startsWith("Patient/"))?.actor
}

/** Reads the practitioner participant off an appointment. */
export function appointmentPractitioner(appointment: Appointment) {
  return appointment.participant?.find((p) => p.actor?.reference?.startsWith("Practitioner/"))
    ?.actor
}

/** True when the two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap. */
export function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd
}
