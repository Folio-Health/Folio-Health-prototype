import { NextResponse } from "next/server"
import type { Appointment } from "@medplum/fhirtypes"
import { facilityBindingsFromAuthMe, type AuthMeLike } from "@/lib/auth/facility-binding"
import {
  APPOINTMENT_TRANSITIONS,
  isAppointmentAction,
  type AppointmentStatus,
} from "@/lib/appointments/logic"
import { AdminError, medplumFetch } from "@/lib/medplum/admin"

/**
 * Move an appointment through its state machine.
 *
 * PATCH { action: "check-in" | "undo-check-in" | "fulfill" | "cancel" | "no-show",
 *         reason?: string }
 *
 * The transition table (lib/appointments/logic.ts) is enforced HERE, not in
 * the UI: an action whose `from` list doesn't include the current status is
 * refused with 409, so a stale screen can't fulfil a cancelled appointment.
 * Terminal states (fulfilled / cancelled / noshow) allow nothing further.
 * Cancel requires a reason; no-show is an explicit decision (there is no
 * automatic timeout anywhere in this module — by design).
 *
 * Facility check: a facility user may only act on appointments stamped with
 * THEIR facility; the write itself runs with the service identity because the
 * compartment-scoped policies are read-only for direct writes.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[A-Za-z0-9\-.]{1,64}$/.test(id)) {
      return NextResponse.json({ error: "Invalid appointment id." }, { status: 400 })
    }

    const me = await medplumFetch<AuthMeLike & { membership?: { admin?: boolean } }>("auth/me")
    const facilityRefs = facilityBindingsFromAuthMe(me).map((b) => b.reference)
    const isAdmin = me?.membership?.admin === true
    if (facilityRefs.length === 0 && !isAdmin) {
      return NextResponse.json(
        { error: "Your account is not bound to a facility." },
        { status: 403 }
      )
    }

    let body: { action?: string; reason?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    const action = String(body.action ?? "")
    if (!isAppointmentAction(action)) {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 })
    }
    const reason = String(body.reason ?? "").trim()
    if (action === "cancel" && !reason) {
      return NextResponse.json(
        { error: "A cancellation reason is required." },
        { status: 400 }
      )
    }

    const appointment = await medplumFetch<Appointment>(
      `fhir/R4/Appointment/${encodeURIComponent(id)}`,
      { privileged: true }
    )

    // Facility users may only touch their own facility's appointments.
    const account = (appointment.meta as { account?: { reference?: string } } | undefined)?.account
    if (!isAdmin && account?.reference && !facilityRefs.includes(account.reference)) {
      return NextResponse.json(
        { error: "This appointment belongs to another facility." },
        { status: 403 }
      )
    }

    const transition = APPOINTMENT_TRANSITIONS[action]
    const current = (appointment.status ?? "booked") as AppointmentStatus
    if (!transition.from.includes(current)) {
      return NextResponse.json(
        {
          error: `Cannot ${action.replace("-", " ")} an appointment that is ${current}.`,
        },
        { status: 409 }
      )
    }

    const updated = await medplumFetch<Appointment>(
      `fhir/R4/Appointment/${encodeURIComponent(id)}`,
      {
        privileged: true,
        method: "PUT",
        body: JSON.stringify({
          ...appointment,
          status: transition.to,
          ...(action === "cancel" ? { cancelationReason: { text: reason.slice(0, 200) } } : {}),
          ...(action === "no-show" && reason
            ? { comment: `No-show: ${reason.slice(0, 200)}` }
            : {}),
        }),
      }
    )

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[api/appointments/:id] transition failed", error)
    return NextResponse.json({ error: "Could not update the appointment." }, { status: 502 })
  }
}
