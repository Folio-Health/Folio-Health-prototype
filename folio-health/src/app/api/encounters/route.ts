import { NextResponse } from "next/server"
import type { Patient } from "@medplum/fhirtypes"
import { assertVisible, clinicalErrorResponse, clinicalSession, requireRole } from "@/lib/medplum/clinical"
import { openEncounter } from "@/lib/medplum/encounters"

/**
 * Open a visit for a patient who has no appointment (walk-in / direct
 * presentation) — the "direct-encounter" pattern from the front-office
 * research. Scheduled patients get their Encounter automatically at
 * check-in (see /api/appointments/[id]).
 *
 * POST { patientId, reason? }  — nurse, doctor or front desk
 */
export async function POST(request: Request) {
  try {
    const session = await clinicalSession()
    const facility = requireRole(session, ["nurse", "doctor", "front-desk"], "open a visit")

    let body: { patientId?: string; reason?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    if (!body.patientId) return NextResponse.json({ error: "A patient is required." }, { status: 400 })

    const patient = await assertVisible<Patient>(`Patient/${body.patientId}`)
    const name = patient.name?.[0]
    const display = name?.text ?? [name?.given?.join(" "), name?.family].filter(Boolean).join(" ")

    const encounter = await openEncounter(
      {
        patientRef: `Patient/${patient.id}`,
        patientDisplay: display || undefined,
        reason: body.reason?.trim().slice(0, 300) || undefined,
      },
      facility
    )
    return NextResponse.json(encounter, { status: 201 })
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not open the visit.")
    return NextResponse.json(body, { status })
  }
}
