import { NextResponse } from "next/server"
import { facilityBindingsFromAuthMe, type AuthMeLike } from "@/lib/auth/facility-binding"
import { AdminError, medplumFetch } from "@/lib/medplum/admin"

/**
 * Register a patient at the signed-in user's facility.
 *
 * Facility users cannot create a Patient directly against FHIR: their
 * AccessPolicy scopes every resource to `_compartment=%organization`, and the
 * compartment tag (`meta.account`) is a protected field only project admins
 * may set — so a client-side create arrives untagged, matches no compartment,
 * and Medplum refuses it with 403 (verified end-to-end against this server).
 *
 * So registration goes through here instead: the route derives the caller's
 * facility from their own session (the server-compiled policy — not from
 * anything the client sends), then performs the create with the service
 * identity, stamping `meta.account` so the record lands in the caller's
 * facility compartment, visible to exactly the people who should see it.
 *
 * The caller cannot choose the facility: whatever they put in `meta` is
 * discarded and their session's binding is used. A session with no facility
 * binding (and no admin flag) cannot register patients at all.
 */
export async function POST(request: Request) {
  try {
    const me = await medplumFetch<AuthMeLike & { membership?: { admin?: boolean } }>("auth/me")
    const facility = facilityBindingsFromAuthMe(me)[0] ?? null
    const isAdmin = me?.membership?.admin === true

    if (!facility && !isAdmin) {
      return NextResponse.json(
        { error: "Your account is not bound to a facility, so it cannot register patients." },
        { status: 403 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    if (body?.resourceType !== "Patient") {
      return NextResponse.json({ error: "Body must be a FHIR Patient resource." }, { status: 400 })
    }

    // Client-supplied id/meta are discarded: the server owns identity and the
    // compartment stamp.
    delete body.id
    delete body.meta

    const created = await medplumFetch<Record<string, unknown>>("fhir/R4/Patient", {
      privileged: true,
      method: "POST",
      body: JSON.stringify({
        ...body,
        resourceType: "Patient",
        ...(facility ? { meta: { account: facility } } : {}),
      }),
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[api/patients] create failed", error)
    return NextResponse.json({ error: "Could not register the patient." }, { status: 502 })
  }
}
