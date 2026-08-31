import type {
  MedicationDispense,
  MedicationRequest,
  Practitioner,
  PractitionerRole,
  Reference,
} from "@medplum/fhirtypes"
import type {
  Prescription,
  PrescriptionMedication,
  PrescriptionStatus,
} from "@/lib/mock/pharmacy"

/**
 * Prescriptions to FHIR.
 *
 *   Prescription        -> MedicationRequest  (what was prescribed)
 *   dispensing it       -> MedicationDispense (what the pharmacy handed over)
 *
 * ONE REQUEST PER DRUG. The UI models a prescription as one record holding
 * several medications; FHIR models one MedicationRequest per medication. They
 * are grouped back together by a shared group identifier, the same approach
 * used for vitals — and for the same reason: a prescription written for three
 * drugs at 10:31 must not merge with a different one written at the same second.
 *
 * WHY NOT ONE REQUEST WITH SEVERAL MEDICATIONS: MedicationRequest has a single
 * `medication[x]`. Cramming several drugs into one would make each drug's
 * status, dose and dispense record unaddressable — you could not mark one
 * dispensed and another cancelled, which is exactly what a pharmacy does.
 */

export const PRESCRIPTION_GROUP_SYSTEM = "https://folio.health/fhir/sid/prescription-group"

/** Folio's drug catalogue id, so a request can be traced back to stock. */
export const DRUG_CODE_SYSTEM = "https://folio.health/fhir/sid/drug"

// -- Status -----------------------------------------------------------------

export function toPrescriptionStatus(requests: MedicationRequest[]): PrescriptionStatus {
  if (requests.length === 0) return "To Dispense"
  // Cancelled only when EVERY line is cancelled: a prescription with one drug
  // withdrawn is still a live prescription for the rest.
  if (requests.every((r) => r.status === "cancelled" || r.status === "stopped")) return "Cancelled"
  if (requests.every((r) => r.status === "completed")) return "Dispensed"
  return "To Dispense"
}

// -- Reading ----------------------------------------------------------------

function groupIdOf(request: MedicationRequest): string | undefined {
  return request.identifier?.find((i) => i.system === PRESCRIPTION_GROUP_SYSTEM)?.value
}

export function toPrescriptionMedication(request: MedicationRequest): PrescriptionMedication {
  const concept = request.medicationCodeableConcept
  const dosage = request.dosageInstruction?.[0]
  return {
    drugId: concept?.coding?.find((c) => c.system === DRUG_CODE_SYSTEM)?.code ?? "",
    drugName: concept?.text ?? concept?.coding?.[0]?.display ?? "Medication",
    dosage: dosage?.text ?? "",
    // `quantity` is what the pharmacy hands over, which FHIR keeps in
    // dispenseRequest rather than on the dosage.
    quantity: request.dispenseRequest?.quantity?.value ?? 0,
  }
}

/**
 * Reassemble MedicationRequests into UI prescriptions, newest first.
 *
 * Requests with no group identifier are skipped rather than guessed at: a
 * medication order written by another system will not follow this convention,
 * and inventing a grouping would fabricate prescriptions nobody wrote.
 */
export function toPrescriptions(requests: MedicationRequest[]): Prescription[] {
  const groups = new Map<string, MedicationRequest[]>()
  for (const request of requests) {
    const groupId = groupIdOf(request)
    if (!groupId) continue
    const existing = groups.get(groupId)
    if (existing) existing.push(request)
    else groups.set(groupId, [request])
  }

  const prescriptions: Prescription[] = []
  for (const [groupId, members] of groups) {
    const first = members[0]
    const patientId = first.subject?.reference?.split("/")[1]
    if (!patientId) continue

    prescriptions.push({
      id: groupId,
      patientId,
      medications: members.map(toPrescriptionMedication),
      prescribedByStaffId: first.requester?.reference?.split("/")[1] ?? "",
      date: first.authoredOn ?? first.meta?.lastUpdated ?? "",
      status: toPrescriptionStatus(members),
    })
  }

  return prescriptions.sort((a, b) => b.date.localeCompare(a.date))
}

// -- Writing ----------------------------------------------------------------

export interface BuildPrescriptionInput {
  patientId: string
  medications: PrescriptionMedication[]
  requester?: Reference<Practitioner | PractitionerRole>
  note?: string
}

export function buildPrescription(input: BuildPrescriptionInput): MedicationRequest[] {
  const groupId = globalThis.crypto.randomUUID()
  const now = new Date().toISOString()

  return input.medications.map((medication) => ({
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    identifier: [{ system: PRESCRIPTION_GROUP_SYSTEM, value: groupId }],
    // Coded with Folio's own catalogue id, not a guessed RxNorm code. A wrong
    // drug code is a prescribing error, not a data-quality one.
    medicationCodeableConcept: {
      ...(medication.drugId
        ? { coding: [{ system: DRUG_CODE_SYSTEM, code: medication.drugId, display: medication.drugName }] }
        : {}),
      text: medication.drugName,
    },
    subject: { reference: `Patient/${input.patientId}` },
    authoredOn: now,
    ...(medication.dosage ? { dosageInstruction: [{ text: medication.dosage }] } : {}),
    ...(medication.quantity
      ? { dispenseRequest: { quantity: { value: medication.quantity } } }
      : {}),
    ...(input.requester ? { requester: input.requester } : {}),
    ...(input.note ? { note: [{ text: input.note }] } : {}),
  }))
}

/**
 * Record that a prescribed medication was handed over.
 *
 * A MedicationDispense is created rather than only flipping the request to
 * completed, because "what the pharmacy actually gave out" is a separate fact
 * from "what the doctor asked for" — quantities can differ, and only the
 * dispense record can say so.
 */
export function buildDispense(
  request: MedicationRequest,
  options: { performer?: Reference<Practitioner | PractitionerRole>; quantity?: number } = {}
): MedicationDispense {
  return {
    resourceType: "MedicationDispense",
    status: "completed",
    medicationCodeableConcept: request.medicationCodeableConcept,
    subject: request.subject,
    authorizingPrescription: request.id ? [{ reference: `MedicationRequest/${request.id}` }] : [],
    whenHandedOver: new Date().toISOString(),
    quantity: {
      value: options.quantity ?? request.dispenseRequest?.quantity?.value,
    },
    ...(options.performer ? { performer: [{ actor: options.performer }] } : {}),
    ...(request.dosageInstruction ? { dosageInstruction: request.dosageInstruction } : {}),
  }
}
