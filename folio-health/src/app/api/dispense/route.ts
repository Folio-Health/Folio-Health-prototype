import { NextResponse } from "next/server"
import type { MedicationDispense, MedicationRequest } from "@medplum/fhirtypes"
import {
  assertVisible,
  clinicalErrorResponse,
  clinicalSession,
  requireRole,
  stampedCreate,
  stampedUpdate,
} from "@/lib/medplum/clinical"

/**
 * Dispense a prescription — pharmacist only.
 *
 * POST { medicationRequestId, quantity?, note? }
 *
 * Closed-loop medication (emr-clinical-flows.md §3): the pharmacist can
 * only dispense an ACTIVE prescription written by a doctor; dispensing
 * writes a `MedicationDispense` (completed, performer = the pharmacist,
 * authorizingPrescription → the order) and completes the order. Nothing is
 * edited on the prescription itself — the dispense record is what the
 * pharmacist owns.
 */
export async function POST(request: Request) {
  try {
    const session = await clinicalSession()
    const facility = requireRole(session, ["pharmacist"], "dispense medication")

    let body: { medicationRequestId?: string; quantity?: number | string; note?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    if (!body.medicationRequestId) {
      return NextResponse.json({ error: "A prescription is required." }, { status: 400 })
    }

    const rx = await assertVisible<MedicationRequest>(`MedicationRequest/${body.medicationRequestId}`)
    if (rx.status !== "active") {
      return NextResponse.json(
        { error: `This prescription is ${rx.status}; only an active prescription can be dispensed.` },
        { status: 409 }
      )
    }
    if (!rx.subject?.reference) return NextResponse.json({ error: "The prescription has no patient." }, { status: 409 })

    const quantity = body.quantity === undefined || body.quantity === "" ? undefined : Number(body.quantity)
    if (quantity !== undefined && (!Number.isFinite(quantity) || quantity <= 0)) {
      return NextResponse.json({ error: "Quantity must be a positive number." }, { status: 400 })
    }
    const now = new Date().toISOString()
    const note = String(body.note ?? "").trim()

    const dispense = await stampedCreate<MedicationDispense>(
      {
        resourceType: "MedicationDispense",
        status: "completed",
        medicationCodeableConcept: rx.medicationCodeableConcept ?? { text: "Medication" },
        subject: rx.subject,
        ...(rx.encounter ? { context: rx.encounter } : {}),
        authorizingPrescription: [{ reference: `MedicationRequest/${rx.id}` }],
        ...(session.practitionerRef
          ? { performer: [{ actor: { reference: session.practitionerRef, display: session.practitionerDisplay } }] }
          : {}),
        ...(quantity !== undefined
          ? { quantity: { value: quantity, ...(rx.dispenseRequest?.quantity?.unit ? { unit: rx.dispenseRequest.quantity.unit } : {}) } }
          : rx.dispenseRequest?.quantity
            ? { quantity: rx.dispenseRequest.quantity }
            : {}),
        dosageInstruction: rx.dosageInstruction,
        whenPrepared: now,
        whenHandedOver: now,
        ...(note ? { note: [{ text: note.slice(0, 500), time: now }] } : {}),
      },
      facility
    )

    const completed = await stampedUpdate<MedicationRequest>(
      `MedicationRequest/${rx.id}`,
      (existing) => ({ ...existing, status: "completed" }),
      facility
    )

    return NextResponse.json({ dispense, prescription: completed }, { status: 201 })
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not record the dispense.")
    return NextResponse.json(body, { status })
  }
}
