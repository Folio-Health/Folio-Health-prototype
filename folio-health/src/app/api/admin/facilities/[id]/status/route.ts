import { NextResponse } from "next/server"
import type { Organization } from "@medplum/fhirtypes"
import { AdminError, medplumFetch, requirePlatformAdmin } from "@/lib/medplum/admin"

/**
 * Activate or deactivate a facility.
 *
 * WHAT THIS DOES: flips FHIR `Organization.active`, the record-level flag for
 * "is this organization still in active use".
 *
 * WHAT IT DOES NOT DO — and this is the important part: it does not revoke
 * anyone's access. Medplum scopes a user through their ProjectMembership's
 * `%organization` parameter and never consults `Organization.active`, so a
 * deactivated facility's staff can still sign in and reach their own records.
 * Real offboarding means disabling those memberships too, which is a separate,
 * far more destructive operation and is deliberately not bundled in here.
 *
 * The UI states this plainly rather than implying a security boundary that does
 * not exist.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params

    const body = await request.json().catch(() => ({}))
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "`active` must be true or false." }, { status: 400 })
    }

    // Read-modify-write so no other field is clobbered by a stale copy.
    const current = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(id)}`
    )

    const updated = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify({ ...current, active: body.active }),
      }
    )

    return NextResponse.json({ id: updated.id, name: updated.name, active: updated.active !== false })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facilities/status] failed", error)
    return NextResponse.json({ error: "Could not update the facility status." }, { status: 502 })
  }
}
