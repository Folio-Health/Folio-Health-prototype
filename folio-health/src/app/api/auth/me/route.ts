import { NextResponse } from "next/server"
import { FOLIO_ROLE_SYSTEM } from "@/lib/auth/roles"
import { medplumUrl } from "@/lib/medplum/config"
import { getAccessToken, refreshAccessToken } from "@/lib/medplum/session"

/**
 * The signed-in user.
 *
 * Medplum's `/auth/me` returns the ProjectMembership together with the linked
 * profile resource (usually a Practitioner), which is what the app shell needs
 * to show who is actually logged in — rather than the mock staff record the
 * prototype used to display.
 */
export async function GET() {
  let token = await getAccessToken()
  if (!token) token = await refreshAccessToken()
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  async function fetchMe(accessToken: string) {
    return fetch(medplumUrl("auth/me"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
  }

  try {
    let response = await fetchMe(token)
    if (response.status === 401) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) return NextResponse.json({ error: "Session expired." }, { status: 401 })
      response = await fetchMe(refreshed)
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Could not load your profile." }, { status: response.status })
    }

    const body = await response.json()
    const profile = body?.profile ?? {}

    // Practitioner/Patient carry `name` as HumanName[]; ClientApplication and
    // Bot carry it as a plain string. Indexing a string would yield its first
    // character, so the two shapes are handled separately.
    let displayName = ""
    if (typeof profile.name === "string") {
      displayName = profile.name
    } else if (Array.isArray(profile.name)) {
      const name = profile.name[0]
      displayName =
        name?.text ?? [name?.given?.join(" "), name?.family].filter(Boolean).join(" ")
    }

    // ProjectMembership.admin is server-held and the user cannot edit it — it is
    // the only thing that grants the platform plane.
    const isProjectAdmin = Boolean(body?.membership?.admin)

    // The facility the membership binds this user to, passed into the
    // AccessPolicy's %organization variable.
    const facilityParam = (body?.membership?.access ?? [])
      .flatMap((entry: { parameter?: { name?: string; valueReference?: { reference?: string; display?: string } }[] }) =>
        entry.parameter ?? []
      )
      .find((p: { name?: string }) => p?.name === "organization")
    const facility = facilityParam?.valueReference ?? null

    // Untrusted: ordinary FHIR tags the user could PATCH. Reconciled client-side
    // against `admin` and `facility` before they mean anything.
    const roleTags: string[] = (profile.meta?.tag ?? [])
      .filter((t: { system?: string }) => t.system === FOLIO_ROLE_SYSTEM)
      .map((t: { code?: string }) => t.code)
      .filter(Boolean)

    return NextResponse.json(
      {
        id: profile.id ?? null,
        resourceType: profile.resourceType ?? null,
        name: displayName || "Signed-in user",
        email: profile.telecom?.find((t: { system?: string }) => t.system === "email")?.value ?? null,
        admin: isProjectAdmin,
        project: body?.project?.name ?? null,
        facilityId: facility?.reference?.split("/")[1] ?? null,
        facilityName: facility?.display ?? null,
        roleTags,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[auth/me] request failed", error)
    return NextResponse.json({ error: "Could not reach the Folio server." }, { status: 502 })
  }
}
