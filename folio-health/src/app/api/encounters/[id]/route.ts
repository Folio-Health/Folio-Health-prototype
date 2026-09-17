import { NextResponse } from "next/server"
import type { Composition, Encounter } from "@medplum/fhirtypes"
import {
  ENCOUNTER_TRANSITIONS,
  encounterStatus,
  isEncounterAction,
} from "@/lib/clinical/encounter"
import {
  assertVisible,
  clinicalErrorResponse,
  clinicalSession,
  privilegedSearch,
  requireRole,
  stampedUpdate,
} from "@/lib/medplum/clinical"

/**
 * Move a visit through its state machine.
 *
 * PATCH { action: "start-consult" | "finish" | "cancel", reason? }
 *
 *  - start-consult: doctor only (opens the consultation)
 *  - finish: doctor only, and REFUSED until the clerking note is signed —
 *    a visit closes on a signed record, never on a draft
 *  - cancel: nurse or doctor, reason required (left without being seen)
 *  - triage is not an action here: it happens when vitals are filed
 *    (/api/vitals), because the vitals ARE the triage.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await clinicalSession()

    let body: { action?: string; reason?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    const action = String(body.action ?? "")
    if (!isEncounterAction(action) || action === "triage") {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 })
    }

    const facility =
      action === "cancel"
        ? requireRole(session, ["nurse", "doctor"], "cancel a visit")
        : requireRole(session, ["doctor"], action === "finish" ? "close a visit" : "start a consultation")

    const encounter = await assertVisible<Encounter>(`Encounter/${id}`)
    const current = encounterStatus(encounter)
    const transition = ENCOUNTER_TRANSITIONS[action]
    if (!transition.from.includes(current)) {
      return NextResponse.json(
        { error: `Cannot ${action.replace("-", " ")} a visit that is "${current}".` },
        { status: 409 }
      )
    }

    const reason = String(body.reason ?? "").trim()
    if (action === "cancel" && !reason) {
      return NextResponse.json({ error: "A reason is required to cancel a visit." }, { status: 400 })
    }

    if (action === "finish") {
      const signed = await privilegedSearch<Composition>(
        `Composition?encounter=Encounter/${encodeURIComponent(id)}&status=final&_count=1`
      )
      if (signed.length === 0) {
        return NextResponse.json(
          { error: "Sign the clerking note before closing the visit." },
          { status: 409 }
        )
      }
    }

    const now = new Date().toISOString()
    const updated = await stampedUpdate<Encounter>(
      `Encounter/${id}`,
      (existing) => ({
        ...existing,
        status: transition.to,
        statusHistory: [
          ...(existing.statusHistory ?? []).map((h, i, arr) =>
            i === arr.length - 1 && !h.period?.end ? { ...h, period: { ...h.period, end: now } } : h
          ),
          { status: transition.to, period: { start: now } },
        ],
        ...(transition.to === "finished" || transition.to === "cancelled"
          ? { period: { ...existing.period, end: now } }
          : {}),
        ...(action === "cancel" ? { reasonCode: [...(existing.reasonCode ?? []), { text: `Cancelled: ${reason}` }] } : {}),
        ...(action === "start-consult" && session.practitionerRef
          ? {
              participant: [
                ...(existing.participant ?? []).filter(
                  (p) => p.individual?.reference !== session.practitionerRef
                ),
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
                  individual: { reference: session.practitionerRef, display: session.practitionerDisplay },
                },
              ],
            }
          : {}),
      }),
      facility
    )
    return NextResponse.json(updated)
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not update the visit.")
    return NextResponse.json(body, { status })
  }
}
