import { getPatientById } from "@/lib/mock/patients"
import { getAppointmentsForPatient } from "@/lib/mock/appointments"
import { PRESCRIPTIONS } from "@/lib/mock/pharmacy"
import type { SnapshotSection } from "@/features/patients/lib/patient-tabs-access"

/**
 * The encounter snapshot (Implementation Manuscript §5).
 *
 * §3 gives lab, radiology and pharmacy a *snapshot* rather than the chart, and
 * §5 names the mechanism that produces it: because those roles only get a
 * high-level summary rather than the physician's full documentation, an
 * AI-generated summary of the encounter is what answers "why was this
 * ordered" for a downstream role without exposing the note itself.
 *
 * WHAT THIS FILE ACTUALLY DOES, so nobody reads more into it than is there:
 * it composes the snapshot deterministically from the record — order
 * indication, presenting complaint, allergies, medication history. No model is
 * called; generating the narrative is a server-side concern and this is the
 * frontend. `summarySource` carries that distinction into the UI so the
 * reader is never shown a machine summary that no machine wrote.
 *
 * The shape is the contract either way: swap `summarySource` to "ai" and fill
 * `summary` from the backend, and every consumer keeps working unchanged.
 */

const ALL_SECTIONS: SnapshotSection[] = ["reason", "complaint", "allergies", "medications"]

export type SnapshotSummarySource = "composed" | "ai"

export interface SnapshotMedication {
  drugName: string
  dosage: string
  prescribedOn: string
}

export interface EncounterSnapshot {
  patientId: string
  patientName: string
  /** "34 yrs · Female" — enough to read a reference range or a dose against. */
  ageGender: string
  /** Why this specific order exists (§4.4 "reason for test"). */
  reason: string
  /** The presenting complaint that brought the patient in (§4.3 step 1). */
  complaint: string
  /** §4.6 flags these as always-visible and non-negotiable for pharmacy. */
  allergies: string[]
  /** Medication history (§4.6), most recent first. */
  medications: SnapshotMedication[]
  summary: string
  summarySource: SnapshotSummarySource
}

/** The most recent appointment's reason stands in for the presenting complaint. */
function latestComplaint(patientId: string): string {
  const appointments = getAppointmentsForPatient(patientId)
  if (appointments.length === 0) return ""
  const mostRecent = [...appointments].sort((a, b) => b.startTime.localeCompare(a.startTime))[0]
  return mostRecent?.reason ?? ""
}

function medicationHistory(patientId: string): SnapshotMedication[] {
  return PRESCRIPTIONS.filter((rx) => rx.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .flatMap((rx) =>
      rx.medications.map((med) => ({
        drugName: med.drugName,
        dosage: med.dosage,
        prescribedOn: rx.date,
      }))
    )
}

/**
 * One or two sentences a downstream professional can act on, assembled from
 * the fields above. Deliberately plain: it answers "why am I being asked to do
 * this", which is the whole job of the snapshot.
 *
 * It is scoped by `sections` for the same reason the sections themselves are
 * (§3: no two roles see the same data). A summary that tells a lab scientist
 * "2 recorded allergies" while the allergies section is withheld from their
 * role leaks the fact and helps nobody — it names something they cannot see.
 * So each sentence appears only when the section behind it does.
 */
function composeSummary(parts: {
  ageGender: string
  reason: string
  complaint: string
  allergies: string[]
  sections: SnapshotSection[]
}): string {
  const has = (section: SnapshotSection) => parts.sections.includes(section)
  const sentences: string[] = []

  const complaintClause =
    has("complaint") && parts.complaint ? `presenting with ${parts.complaint.toLowerCase()}` : ""
  const opening = [parts.ageGender, complaintClause].filter(Boolean).join(", ")
  if (opening) sentences.push(`${opening}.`)

  if (has("reason") && parts.reason) sentences.push(`Ordered for: ${parts.reason}.`)

  if (has("allergies") && parts.allergies.length > 0) {
    sentences.push(
      `${parts.allergies.length} recorded ${parts.allergies.length === 1 ? "allergy" : "allergies"} — check before proceeding.`
    )
  }

  return sentences.join(" ")
}

/**
 * Build a snapshot from values the caller already holds.
 *
 * The patient workspace reads FHIR (`PatientSummary`, `AllergyIntolerance`),
 * while the lab, imaging and pharmacy modules still read the mock layer, and
 * the two use different patient ids. Rather than have the snapshot guess which
 * world it is in, this takes the fields directly; `buildEncounterSnapshot`
 * below is the mock-layer convenience wrapper around it.
 */
export function snapshotFromParts(parts: {
  patientId: string
  patientName: string
  ageGender: string
  reason?: string
  complaint?: string
  allergies?: string[]
  medications?: SnapshotMedication[]
  /** The reader's scope, so the summary never names a withheld section. */
  sections?: SnapshotSection[]
}): EncounterSnapshot {
  const sections = parts.sections ?? ALL_SECTIONS
  const inScope = (section: SnapshotSection) => sections.includes(section)

  const complaint = inScope("complaint") ? (parts.complaint ?? "") : ""
  const reason = inScope("reason") ? (parts.reason?.trim() || (parts.complaint ?? "")) : ""
  // Withheld sections are omitted from the object, not merely hidden at
  // render time — a field that never leaves the builder cannot be leaked by
  // a future consumer that forgets to check `sections`.
  const allergies = inScope("allergies") ? (parts.allergies ?? []) : []

  return {
    patientId: parts.patientId,
    patientName: parts.patientName,
    ageGender: parts.ageGender,
    reason,
    complaint,
    allergies,
    medications: inScope("medications") ? (parts.medications ?? []) : [],
    summary: composeSummary({
      ageGender: parts.ageGender,
      reason,
      complaint,
      allergies,
      sections,
    }),
    summarySource: "composed",
  }
}

/**
 * Build the snapshot for one patient and one order, from the mock layer.
 *
 * @param patientId the patient the order belongs to
 * @param reason    the order's own indication, when the module has one
 *                  (radiology carries `clinicalIndication`, lab now does too).
 *                  Falls back to the presenting complaint.
 */
export function buildEncounterSnapshot(
  patientId: string,
  reason?: string,
  sections: SnapshotSection[] = ALL_SECTIONS
): EncounterSnapshot | null {
  const patient = getPatientById(patientId)
  if (!patient) return null

  const inScope = (section: SnapshotSection) => sections.includes(section)

  const rawComplaint = latestComplaint(patientId)
  const ageGender = `${patient.age} yrs · ${patient.gender}`
  const resolvedReason = reason?.trim() || rawComplaint

  // See snapshotFromParts: withheld sections are omitted, not hidden.
  const complaint = inScope("complaint") ? rawComplaint : ""
  const allergies = inScope("allergies") ? patient.allergies : []

  return {
    patientId: patient.id,
    patientName: patient.name,
    ageGender,
    reason: inScope("reason") ? resolvedReason : "",
    complaint,
    allergies,
    medications: inScope("medications") ? medicationHistory(patientId) : [],
    summary: composeSummary({
      ageGender,
      reason: resolvedReason,
      complaint,
      allergies,
      sections,
    }),
    summarySource: "composed",
  }
}
