import { NextResponse } from "next/server"
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

    return NextResponse.json(
      {
        id: profile.id ?? null,
        resourceType: profile.resourceType ?? null,
        name: displayName || "Signed-in user",
        email: profile.telecom?.find((t: { system?: string }) => t.system === "email")?.value ?? null,
        // The admin flag lives on the ProjectMembership, not at the top level.
        admin: Boolean(body?.membership?.admin),
        project: body?.project?.name ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[auth/me] request failed", error)
    return NextResponse.json({ error: "Could not reach the Folio server." }, { status: 502 })
  }
}
