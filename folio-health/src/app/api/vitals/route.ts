import { NextResponse } from "next/server"
import type { Encounter, Observation } from "@medplum/fhirtypes"
import { encounterStatus } from "@/lib/clinical/encounter"
import { buildVitalObservations, validateVitals, type VitalValues } from "@/lib/clinical/vitals"
import {
  assertVisible,
  clinicalErrorResponse,
  clinicalSession,
  requireRole,
  stampedCreate,
  stampedUpdate,
} from "@/lib/medplum/clinical"

/**
 * File a set of vital signs against a visit.
 *
 * POST { encounterId, values: { systolic, diastolic, temperature, heartRate,
 *        respiratoryRate?, spo2?, weight?, height? } }   — nurse or doctor
 *
 * Each sign is filed as a LOINC-coded `Observation` (BP as one panel with
 * systolic/diastolic components), performer = the caller, effective = now.
 * Filing vitals on a visit that is still `arrived` IS the triage step, so
 * the Encounter moves to `triaged` in the same request.
 */
export async function POST(request: Request) {
  try {
    const session = await clinicalSession()
    const facility = requireRole(session, ["nurse", "doctor"], "record vital signs")

    let body: { encounterId?: string; values?: Record<string, unknown> }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    if (!body.encounterId) return NextResponse.json({ error: "A visit is required." }, { status: 400 })

    const values: VitalValues = {}
    for (const [key, raw] of Object.entries(body.values ?? {})) {
      if (raw === "" || raw === null || raw === undefined) continue
      const n = typeof raw === "number" ? raw : Number(raw)
      if (Number.isNaN(n)) return NextResponse.json({ error: `${key} must be a number.` }, { status: 400 })
      values[key] = n
    }
    const problem = validateVitals(values)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })

    const encounter = await assertVisible<Encounter>(`Encounter/${body.encounterId}`)
    const status = encounterStatus(encounter)
    if (status === "finished" || status === "cancelled") {
      return NextResponse.json({ error: "This visit is closed." }, { status: 409 })
    }
    const patientRef = encounter.subject?.reference
    if (!patientRef) return NextResponse.json({ error: "The visit has no patient." }, { status: 409 })

    const observations = buildVitalObservations(values, {
      patientRef,
      encounterRef: `Encounter/${encounter.id}`,
      performerRef: session.practitionerRef,
      performerDisplay: session.practitionerDisplay,
      effective: new Date().toISOString(),
    })
    const created: Observation[] = []
    for (const observation of observations) {
      created.push(await stampedCreate<Observation>(observation, facility))
    }

    let updatedEncounter = encounter
    if (status === "arrived") {
      const now = new Date().toISOString()
      updatedEncounter = await stampedUpdate<Encounter>(
        `Encounter/${encounter.id}`,
        (existing) => ({
          ...existing,
          status: "triaged",
          statusHistory: [
            ...(existing.statusHistory ?? []).map((h, i, arr) =>
              i === arr.length - 1 && !h.period?.end ? { ...h, period: { ...h.period, end: now } } : h
            ),
            { status: "triaged", period: { start: now } },
          ],
        }),
        facility
      )
    }

    return NextResponse.json({ observations: created, encounter: updatedEncounter }, { status: 201 })
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not record the vital signs.")
    return NextResponse.json(body, { status })
  }
}
