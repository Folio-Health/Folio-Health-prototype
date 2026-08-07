import { NextResponse } from "next/server"
import type { Organization } from "@medplum/fhirtypes"
import {
  AdminError,
  findMembershipsForFacility,
  medplumFetch,
  requirePlatformAdmin,
  setMembershipActive,
} from "@/lib/medplum/admin"

/**
 * Activate or deactivate a facility, optionally revoking its staff's access.
 *
 * Two distinct operations, deliberately separable:
 *
 *  - `active` flips FHIR `Organization.active`, a record-level flag. On its own
 *    it changes NOTHING about who can sign in: Medplum scopes users through
 *    their ProjectMembership and never consults this field.
 *
 *  - `revokeAccess` disables every ProjectMembership bound to the facility.
 *    THIS is what actually locks people out — verified against the live server:
 *    login returns 200, set `membership.active = false`, login returns 401, and
 *    re-enabling restores it. Fully reversible, which is why offboarding does
 *    not delete anything.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params

    const body = await request.json().catch(() => ({}))
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "`active` must be true or false." }, { status: 400 })
    }
    const active: boolean = body.active
    const changeAccess: boolean = body.revokeAccess === true

    // Read-modify-write so no other field is clobbered by a stale copy.
    const current = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(id)}`
    )
    const updated = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify({ ...current, active }) }
    )

    let accountsChanged = 0
    let accountsFailed = 0

    if (changeAccess) {
      const { memberships } = await findMembershipsForFacility(id)
      for (const membership of memberships) {
        try {
          // Deactivating a facility disables its accounts; reactivating restores
          // them. Mirrored so an accidental offboarding is one click to undo.
          if (await setMembershipActive(membership.id, active)) accountsChanged += 1
        } catch (error) {
          // Keep going: a partial revoke that reports honestly beats aborting
          // halfway and leaving the operator unsure who is still in.
          accountsFailed += 1
          console.error(`[admin/facilities/status] membership ${membership.id} failed`, error)
        }
      }
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      active: updated.active !== false,
      accountsChanged,
      accountsFailed,
    })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facilities/status] failed", error)
    return NextResponse.json({ error: "Could not update the facility status." }, { status: 502 })
  }
}
