import { NextResponse } from "next/server"
import type { Appointment } from "@medplum/fhirtypes"
import { facilityBindingsFromAuthMe, type AuthMeLike } from "@/lib/auth/facility-binding"
import {
  RESCHEDULE_OF_EXTENSION_URL,
  intervalsOverlap,
} from "@/lib/appointments/logic"
import { AdminError, medplumFetch } from "@/lib/medplum/admin"

/**
 * Book an appointment at the signed-in user's facility.
 *
 * Writes go through the server for the same reason patient registration does:
 * facility policies scope Appointment to `_compartment=%organization`, and the
 * compartment stamp (`meta.account`) is a project-admin-only field — so the
 * create is performed with the service identity AFTER this route has verified
 * the caller's session and derived their facility from it (never from the
 * request body).
 *
 * Working logic enforced here (docs/research/emr-front-office.md):
 *  - the appointment is created directly as `booked` — the front office is
 *    the authority for all participants, so the proposed/pending negotiation
 *    is deliberately skipped, exactly as production schedulers do;
 *  - double-booking is refused: an overlapping non-terminal appointment for
 *    the same practitioner returns 409 with the conflict named;
 *  - a reschedule is CANCEL + REBOOK with linkage: pass `rescheduleOf` and
 *    this route cancels the original (reason "Rescheduled") and stamps the
 *    new appointment with a reschedule-of extension, in that order.
 */

interface BookBody {
  patientId?: string
  patientDisplay?: string
  practitionerId?: string
  practitionerDisplay?: string
  start?: string
  end?: string
  reason?: string
  rescheduleOf?: string
}

const ID_PATTERN = /^[A-Za-z0-9\-.]{1,64}$/

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    const me = await medplumFetch<AuthMeLike & { membership?: { admin?: boolean } }>("auth/me")
    const facility = facilityBindingsFromAuthMe(me)[0] ?? null
    if (!facility && me?.membership?.admin !== true) {
      return bad("Your account is not bound to a facility, so it cannot book appointments.", 403)
    }

    let body: BookBody
    try {
      body = await request.json()
    } catch {
      return bad("Invalid request body.")
    }

    const { patientId, practitionerId, start, end } = body
    if (!patientId || !ID_PATTERN.test(patientId)) return bad("A patient is required.")
    if (!practitionerId || !ID_PATTERN.test(practitionerId)) return bad("A practitioner is required.")
    if (body.rescheduleOf && !ID_PATTERN.test(body.rescheduleOf)) return bad("Invalid rescheduleOf id.")

    const startMs = start ? Date.parse(start) : NaN
    const endMs = end ? Date.parse(end) : NaN
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return bad("Valid start and end times are required.")
    }
    if (endMs <= startMs) return bad("The appointment must end after it starts.")

    // The patient must exist (and, for facility users, be visible in their
    // compartment — read with the SERVICE identity only to fetch the display
    // name after the caller-scoped existence check passes).
    const patient = await medplumFetch<{ id?: string; name?: { text?: string; given?: string[]; family?: string }[] }>(
      `fhir/R4/Patient/${encodeURIComponent(patientId)}`
    )
    const patientName =
      body.patientDisplay ??
      patient.name?.[0]?.text ??
      [patient.name?.[0]?.given?.join(" "), patient.name?.[0]?.family].filter(Boolean).join(" ")

    // Double-booking check: any non-terminal appointment for this practitioner
    // overlapping the requested window. Searched with the service identity so
    // the check sees the whole project, not just the caller's compartment.
    const dayStart = new Date(startMs)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(startMs)
    dayEnd.setHours(23, 59, 59, 999)
    const existing = await medplumFetch<{ entry?: { resource?: Appointment }[] }>(
      `fhir/R4/Appointment?actor=Practitioner/${encodeURIComponent(practitionerId)}` +
        `&date=ge${dayStart.toISOString()}&date=le${dayEnd.toISOString()}&_count=200`,
      { privileged: true }
    )
    const startIso = new Date(startMs).toISOString()
    const endIso = new Date(endMs).toISOString()
    const conflict = (existing.entry ?? [])
      .map((e) => e.resource)
      .find(
        (a) =>
          a?.start &&
          a.end &&
          (a.status === "booked" || a.status === "arrived") &&
          a.id !== body.rescheduleOf &&
          intervalsOverlap(startIso, endIso, a.start, a.end)
      )
    if (conflict) {
      return NextResponse.json(
        {
          error: `That practitioner already has an appointment from ${new Date(
            conflict.start as string
          ).toLocaleTimeString()} to ${new Date(conflict.end as string).toLocaleTimeString()}. Pick another time.`,
        },
        { status: 409 }
      )
    }

    // Reschedule: cancel the original FIRST so its slot frees up; the research
    // pattern is cancel + rebook with linkage, never an in-place edit.
    if (body.rescheduleOf) {
      const original = await medplumFetch<Appointment>(
        `fhir/R4/Appointment/${encodeURIComponent(body.rescheduleOf)}`,
        { privileged: true }
      )
      if (original.status !== "booked" && original.status !== "arrived") {
        return bad("Only a booked or arrived appointment can be rescheduled.", 409)
      }
      await medplumFetch(`fhir/R4/Appointment/${encodeURIComponent(body.rescheduleOf)}`, {
        privileged: true,
        method: "PUT",
        body: JSON.stringify({
          ...original,
          status: "cancelled",
          cancelationReason: { text: "Rescheduled" },
        }),
      })
    }

    const created = await medplumFetch<Appointment>("fhir/R4/Appointment", {
      privileged: true,
      method: "POST",
      body: JSON.stringify({
        resourceType: "Appointment",
        status: "booked",
        start: startIso,
        end: endIso,
        ...(body.reason?.trim() ? { description: body.reason.trim().slice(0, 500) } : {}),
        ...(body.rescheduleOf
          ? {
              extension: [
                {
                  url: RESCHEDULE_OF_EXTENSION_URL,
                  valueReference: { reference: `Appointment/${body.rescheduleOf}` },
                },
              ],
            }
          : {}),
        participant: [
          {
            actor: { reference: `Patient/${patientId}`, display: patientName || undefined },
            status: "accepted",
          },
          {
            actor: {
              reference: `Practitioner/${practitionerId}`,
              display: body.practitionerDisplay || undefined,
            },
            status: "accepted",
          },
        ],
        ...(facility ? { meta: { account: facility } } : {}),
      }),
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof AdminError) {
      // A 404 reading the patient surfaces here with its own message.
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[api/appointments] booking failed", error)
    return NextResponse.json({ error: "Could not book the appointment." }, { status: 502 })
  }
}
