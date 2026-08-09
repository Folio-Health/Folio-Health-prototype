import { NextResponse } from "next/server"
import type { Organization } from "@medplum/fhirtypes"
import { isFacilityAssignableRole, ROLE_LABELS } from "@/lib/auth/roles"
import {
  AdminError,
  enrichMembershipsWithPractitioners,
  findMembershipsForFacility,
  medplumFetch,
  requireFacilityProvisioner,
} from "@/lib/medplum/admin"
import { inviteFacilityUser } from "@/lib/medplum/provisioning"

/**
 * The accounts scoped to a facility.
 *
 * Used to show exactly whose access is about to be cut BEFORE the operator
 * confirms an offboarding — naming the people is the difference between an
 * informed decision and a surprise.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Widened from platform-admin-only: a facility administrator must be able to
    // see their own staff to manage them. `requireFacilityProvisioner` still
    // pins them to their own facility, so this grants no cross-facility view.
    await requireFacilityProvisioner(id)
    const { memberships, truncated } = await findMembershipsForFacility(id)
    const staff = await enrichMembershipsWithPractitioners(memberships)

    return NextResponse.json({
      staff: staff.map((m) => ({
        id: m.id,
        name: m.name,
        active: m.active,
        admin: m.admin,
        practitionerId: m.practitionerId,
        email: m.email,
        role: m.role,
        roleLabel: m.role && m.role in ROLE_LABELS
          ? ROLE_LABELS[m.role as keyof typeof ROLE_LABELS]
          : null,
        // Lets an administrator see who has not finished setting up, which is
        // exactly who to chase when someone says "I can't get in".
        mustChangePassword: m.mustChangePassword,
      })),
      activeCount: memberships.filter((m) => m.active).length,
      // Surfaced rather than hidden: a truncated list would understate who is
      // about to lose access.
      truncated,
    })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facilities/staff] failed", error)
    return NextResponse.json({ error: "Could not load facility staff." }, { status: 502 })
  }
}

/**
 * Create a clinical staff account for this facility.
 *
 * Provisions exactly like the operator's hospital-admin path
 * (`/api/admin/facility-admins`) — same invite, same role identifier, same
 * first-login temporary-credential flag — so a nurse created here is forced to
 * set a permanent password just as a hospital admin is. Both share
 * `lib/medplum/provisioning.ts` precisely so those two can never diverge.
 *
 * Authorisation comes from `requireFacilityProvisioner`, which pins a facility
 * admin to their OWN facility. `facility-admin` is not an assignable role here:
 * only the platform operator creates those, so a facility admin cannot mint
 * peers, and `platform-admin` is unreachable because it comes from
 * ProjectMembership.admin rather than any policy this route can bind.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: facilityId } = await params
    const { projectId } = await requireFacilityProvisioner(facilityId)

    const body = await request.json().catch(() => ({}))
    const firstName = String(body.firstName ?? "").trim()
    const lastName = String(body.lastName ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const role = String(body.role ?? "").trim()

    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: "First name, last name, email and role are all required." },
        { status: 400 }
      )
    }

    if (!isFacilityAssignableRole(role)) {
      return NextResponse.json(
        { error: "Choose a valid staff role for this facility." },
        { status: 400 }
      )
    }

    // Confirm the facility exists before creating an account bound to it.
    const facility = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(facilityId)}`
    )

    const { practitionerId, tempPassword } = await inviteFacilityUser({
      projectId,
      role,
      firstName,
      lastName,
      email,
      facility: { reference: `Organization/${facility.id}`, display: facility.name },
    })

    return NextResponse.json({
      practitionerId,
      name: `${firstName} ${lastName}`,
      email,
      role,
      roleLabel: ROLE_LABELS[role],
      facility: facility.name,
      // Returned exactly once — it is not stored anywhere retrievable.
      tempPassword,
    })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facilities/staff] create failed", error)
    return NextResponse.json({ error: "Could not create the staff account." }, { status: 502 })
  }
}
