import { NextResponse } from "next/server"
import { facilityBindingsFromAuthMe, type AuthMeLike } from "@/lib/auth/facility-binding"
import {
  AdminError,
  enrichMembershipsWithPractitioners,
  findMembershipsForFacility,
  medplumFetch,
} from "@/lib/medplum/admin"

/**
 * The doctors bookable at the signed-in user's OWN facility.
 *
 * Practitioner is shared directory data — a plain FHIR search would list
 * doctors from every facility in the project. The facility binding lives on
 * the ProjectMembership, which only project admins may read, so this route
 * resolves it server-side: caller's session → their facility → that
 * facility's memberships (service identity) → active, doctor-tagged
 * practitioners, returned as id + display name only.
 */
export async function GET() {
  try {
    const me = await medplumFetch<AuthMeLike & { membership?: { admin?: boolean } }>("auth/me")
    const facility = facilityBindingsFromAuthMe(me)[0] ?? null
    if (!facility) {
      // The operator has no home facility; they book from a facility context
      // in the UI, which facility staff always have.
      return NextResponse.json({ practitioners: [] })
    }

    const facilityId = facility.reference.split("/")[1]
    const { memberships } = await findMembershipsForFacility(facilityId)
    const staff = await enrichMembershipsWithPractitioners(
      memberships.filter((m) => m.active)
    )

    const practitioners = staff
      .filter((m) => m.role === "doctor" && m.active && m.practitionerId)
      .map((m) => ({ id: m.practitionerId as string, name: m.name }))

    return NextResponse.json({ practitioners })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[api/practitioners/bookable] failed", error)
    return NextResponse.json({ error: "Could not load the facility's doctors." }, { status: 502 })
  }
}
