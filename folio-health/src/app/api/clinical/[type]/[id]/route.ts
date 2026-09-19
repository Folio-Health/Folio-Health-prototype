import { NextResponse } from "next/server"
import type { Composition, MedicationRequest, ServiceRequest } from "@medplum/fhirtypes"
import {
  assertVisible,
  clinicalErrorResponse,
  clinicalSession,
  requireRole,
  stampedUpdate,
} from "@/lib/medplum/clinical"

/**
 * Change an existing clinical record — doctor only.
 *
 * PATCH /api/clinical/Composition/:id     { action: "update", section: [...] }
 *                                          { action: "sign" }
 * PATCH /api/clinical/ServiceRequest/:id  { action: "revoke", reason }
 * PATCH /api/clinical/MedicationRequest/:id { action: "cancel", reason }
 *
 * The rules that make the record trustworthy live here:
 *  - a SIGNED note (`final`) is immutable — updates are refused with 409;
 *    corrections are addenda, never edits;
 *  - signing stamps the attester (the signing doctor) and time, and the
 *    server — not the browser — decides the status becomes `final`;
 *  - orders and prescriptions are never deleted: an order becomes
 *    `revoked`, a prescription `cancelled`, with the reason on the record,
 *    and only while still active.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    const session = await clinicalSession()
    const facility = requireRole(session, ["doctor"], "change clinical records")

    let body: { action?: string; section?: Composition["section"]; reason?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    const action = String(body.action ?? "")
    const reference = `${type}/${id}`
    const now = new Date().toISOString()
    const signer = session.practitionerRef
      ? { reference: session.practitionerRef, display: session.practitionerDisplay }
      : undefined

    if (type === "Composition") {
      const note = await assertVisible<Composition>(reference)
      if (note.status === "final" || note.status === "amended") {
        return NextResponse.json(
          { error: "This note is signed and cannot be edited. Add an addendum instead." },
          { status: 409 }
        )
      }
      if (action === "update") {
        if (!Array.isArray(body.section)) {
          return NextResponse.json({ error: "section[] is required." }, { status: 400 })
        }
        const updated = await stampedUpdate<Composition>(
          reference,
          (existing) => ({ ...existing, section: body.section, date: now }),
          facility
        )
        return NextResponse.json(updated)
      }
      if (action === "sign") {
        if (!note.section?.length) {
          return NextResponse.json({ error: "There is nothing to sign yet." }, { status: 409 })
        }
        const signed = await stampedUpdate<Composition>(
          reference,
          (existing) => ({
            ...existing,
            status: "final",
            date: now,
            attester: [
              {
                mode: "legal",
                time: now,
                ...(signer ? { party: signer } : {}),
              },
            ],
          }),
          facility
        )
        return NextResponse.json(signed)
      }
      return NextResponse.json({ error: "Unknown action." }, { status: 400 })
    }

    const reason = String(body.reason ?? "").trim()
    if (!reason) return NextResponse.json({ error: "A reason is required." }, { status: 400 })

    if (type === "ServiceRequest" && action === "revoke") {
      const order = await assertVisible<ServiceRequest>(reference)
      if (order.status !== "active") {
        return NextResponse.json({ error: `Only an active order can be revoked (this one is ${order.status}).` }, { status: 409 })
      }
      const updated = await stampedUpdate<ServiceRequest>(
        reference,
        (existing) => ({
          ...existing,
          status: "revoked",
          note: [...(existing.note ?? []), { text: `Revoked: ${reason}`, time: now, ...(signer ? { authorReference: signer } : {}) }],
        }),
        facility
      )
      return NextResponse.json(updated)
    }

    if (type === "MedicationRequest" && action === "cancel") {
      const rx = await assertVisible<MedicationRequest>(reference)
      if (rx.status !== "active") {
        return NextResponse.json({ error: `Only an active prescription can be cancelled (this one is ${rx.status}).` }, { status: 409 })
      }
      const updated = await stampedUpdate<MedicationRequest>(
        reference,
        (existing) => ({
          ...existing,
          status: "cancelled",
          statusReason: { text: reason },
        }),
        facility
      )
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Unknown action for this record type." }, { status: 400 })
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not update the record.")
    return NextResponse.json(body, { status })
  }
}
