import type { Encounter } from "@medplum/fhirtypes"

/**
 * The visit (Encounter) state machine — the clinical counterpart to the
 * administrative Appointment (docs/research/emr-front-office.md §3,
 * emr-clinical-flows.md §1).
 *
 *   arrived  → triaged      nurse has recorded vitals
 *   triaged  → in-progress  doctor opened the consultation
 *   arrived  → in-progress  doctor sees an untriaged patient (allowed; the
 *                            vitals gate is a workflow norm, not a hard stop)
 *   in-progress → finished  doctor closed the visit — requires a SIGNED
 *                            clerking note (enforced by the server route)
 *   arrived | triaged → cancelled   left without being seen (reason kept)
 *
 * Terminal states allow nothing. R4 statuses are used because the Medplum
 * project is R4.
 */
export type EncounterStatus = "arrived" | "triaged" | "in-progress" | "finished" | "cancelled"

export type EncounterAction = "triage" | "start-consult" | "finish" | "cancel"

export const ENCOUNTER_TRANSITIONS: Record<EncounterAction, { from: EncounterStatus[]; to: EncounterStatus }> = {
  triage: { from: ["arrived"], to: "triaged" },
  "start-consult": { from: ["arrived", "triaged"], to: "in-progress" },
  finish: { from: ["in-progress"], to: "finished" },
  cancel: { from: ["arrived", "triaged"], to: "cancelled" },
}

export function isEncounterAction(value: string): value is EncounterAction {
  return value in ENCOUNTER_TRANSITIONS
}

export function encounterStatus(encounter: Encounter): EncounterStatus {
  const s = encounter.status as EncounterStatus
  return s in ENCOUNTER_TRANSITIONS || s === "finished" || s === "cancelled" || s === "triaged" || s === "in-progress" || s === "arrived"
    ? s
    : "arrived"
}

export const ENCOUNTER_STATUS_LABELS: Record<EncounterStatus, string> = {
  arrived: "Waiting for triage",
  triaged: "Ready for doctor",
  "in-progress": "In consultation",
  finished: "Visit closed",
  cancelled: "Left without being seen",
}

/** Ambulatory visit class, the only class this module opens for now. */
export const AMBULATORY_CLASS = {
  system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  code: "AMB",
  display: "ambulatory",
}

export function encounterPatientRef(encounter: Encounter): string | undefined {
  return encounter.subject?.reference
}

export function encounterPractitioner(encounter: Encounter) {
  return encounter.participant?.find((p) => p.individual?.reference?.startsWith("Practitioner/"))?.individual
}
