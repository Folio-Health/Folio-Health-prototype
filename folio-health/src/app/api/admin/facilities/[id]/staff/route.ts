import { NextResponse } from "next/server"
import {
  AdminError,
  findMembershipsForFacility,
  requirePlatformAdmin,
} from "@/lib/medplum/admin"

/**
 * The accounts scoped to a facility.
 *
 * Used to show exactly whose access is about to be cut BEFORE the operator
 * confirms an offboarding — naming the people is the difference between an
 * informed decision and a surprise.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params
    const { memberships, truncated } = await findMembershipsForFacility(id)

    return NextResponse.json({
      staff: memberships.map((m) => ({
        id: m.id,
        name: m.name,
        active: m.active,
        practitionerId: m.practitionerId,
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
