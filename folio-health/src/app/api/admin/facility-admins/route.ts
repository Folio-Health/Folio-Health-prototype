import { NextResponse } from "next/server"
import type { Organization } from "@medplum/fhirtypes"
import { AdminError, medplumFetch, requirePlatformAdmin } from "@/lib/medplum/admin"
import { inviteFacilityUser } from "@/lib/medplum/provisioning"

/**
 * Create a hospital (facility) administrator for one facility.
 *
 * Mirrors apps/clinician-web/scripts/setup-medplum-tenancy.mjs so the two paths
 * provision identical accounts:
 *
 *   1. Resolve the installed facility-admin AccessPolicy (never re-author it).
 *   2. Invite the user, binding the policy to this facility via %organization.
 *   3. Stamp the Practitioner: role identifier, facility owner, and the
 *      temp-credential flag that forces a password change on first sign-in.
 *
 * `sendEmail: false` — the temp password is handed over in person, because
 * clinic email is unreliable and a mailed credential is a credential in transit.
 */

const ROLE_ID = "facility-admin"

export async function POST(request: Request) {
  try {
    const { projectId } = await requirePlatformAdmin()

    const body = await request.json().catch(() => ({}))
    const facilityId = String(body.facilityId ?? "").trim()
    const firstName = String(body.firstName ?? "").trim()
    const lastName = String(body.lastName ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()

    if (!facilityId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Facility, first name, last name and email are all required." },
        { status: 400 }
      )
    }

    // Confirm the facility exists before creating an account bound to it.
    const facility = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(facilityId)}`
    )
    // Invite + stamp role + first-login flag. Shared with the facility-admin's
    // own staff-creation route so the two paths cannot drift into producing
    // differently-privileged accounts.
    const { practitionerId, tempPassword } = await inviteFacilityUser({
      projectId,
      role: ROLE_ID,
      firstName,
      lastName,
      email,
      facility: { reference: `Organization/${facility.id}`, display: facility.name },
    })

    return NextResponse.json({
      practitionerId,
      name: `${firstName} ${lastName}`,
      email,
      facility: facility.name,
      // Returned exactly once — it is not stored anywhere retrievable.
      tempPassword,
    })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facility-admins] failed", error)
    return NextResponse.json({ error: "Could not create the hospital admin." }, { status: 502 })
  }
}
