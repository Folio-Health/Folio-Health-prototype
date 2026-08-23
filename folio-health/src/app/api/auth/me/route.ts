import { NextResponse } from "next/server"
import { primaryFacilityFromAuthMe } from "@/lib/auth/facility-binding"
import { FOLIO_ROLE_SYSTEM, TEMP_CREDENTIAL_EXTENSION_URL } from "@/lib/auth/roles"
import { demoUserIdFromToken, isDemoMode } from "@/lib/demo/mode"
import { demoCurrentUser } from "@/lib/demo/store"
import { medplumUrl } from "@/lib/medplum/config"
import { getAccessToken, refreshSession } from "@/lib/medplum/session"
import {
  ACCESS_TOKEN_COOKIE,
  MUST_CHANGE_PASSWORD_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/session"

/**
 * The signed-in user.
 *
 * Medplum's `/auth/me` returns the ProjectMembership together with the linked
 * profile resource (usually a Practitioner), which is what the app shell needs
 * to show who is actually logged in — rather than the mock staff record the
 * prototype used to display.
 */
/** 503 when the server is unreachable — a blip must not read as a sign-out. */
function unreachable() {
  return NextResponse.json(
    { error: "Can't reach Folio right now. Check your connection and try again." },
    { status: 503 }
  )
}

export async function GET() {
  // Demo mode: the account is encoded in the session cookie; no Medplum call.
  if (isDemoMode()) {
    const userId = demoUserIdFromToken(await getAccessToken())
    if (!userId) {
      // A leftover REAL session (cookies from before the mode switch) is not a
      // demo session. Delete it so the proxy stops treating the browser as
      // signed in — otherwise /login is unreachable and the user is stuck in a
      // 401 loop on /dashboard. Real mode self-heals the mirror case: Medplum
      // rejects a demo token and `refreshSession` clears the cookies.
      const response = NextResponse.json({ error: "Not authenticated." }, { status: 401 })
      response.cookies.delete(ACCESS_TOKEN_COOKIE)
      response.cookies.delete(REFRESH_TOKEN_COOKIE)
      response.cookies.delete(MUST_CHANGE_PASSWORD_COOKIE)
      return response
    }
    return NextResponse.json(demoCurrentUser(userId), {
      headers: { "Cache-Control": "no-store" },
    })
  }

  let token = await getAccessToken()
  if (!token) {
    const refreshed = await refreshSession()
    if (refreshed.status === "unreachable") return unreachable()
    if (refreshed.status === "expired") {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }
    token = refreshed.accessToken
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
      const refreshed = await refreshSession()
      if (refreshed.status === "unreachable") return unreachable()
      if (refreshed.status === "expired") {
        return NextResponse.json({ error: "Session expired." }, { status: 401 })
      }
      token = refreshed.accessToken
      response = await fetchMe(token)
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

    // The facility the membership binds this user to (the AccessPolicy's
    // %organization). Medplum's auth/me trims `membership.access` away, so this
    // is read from the compiled `accessPolicy` — see lib/auth/facility-binding.
    const facility = primaryFacilityFromAuthMe(body)

    // Untrusted: ordinary FHIR data the user could PATCH. Reconciled client-side
    // against `admin` and `facility` before it means anything.
    //
    // Provisioning writes the role as a Practitioner IDENTIFIER, not a meta.tag
    // (see setup-medplum-tenancy.mjs). Reading meta.tag returned nothing for
    // every user, so everyone fell through to the unprovisioned default.
    const roleTags: string[] = (profile.identifier ?? [])
      .filter((i: { system?: string }) => i.system === FOLIO_ROLE_SYSTEM)
      .map((i: { value?: string }) => i.value)
      .filter(Boolean)

    // Provisioning stamps the owning facility on the Practitioner itself, which
    // is a second source for the facility binding when the membership does not
    // carry an %organization parameter.
    const profileFacility = profile.meta?.account ?? null

    // A first-login temporary credential the user must replace.
    const mustChangePassword = (profile.extension ?? []).some(
      (e: { url?: string; valueBoolean?: boolean }) =>
        e.url === TEMP_CREDENTIAL_EXTENSION_URL && e.valueBoolean === true
    )

    // The compiled policy carries the facility's id but not its name; read the
    // Organization (directory data every policy can see) for the display name.
    // Best-effort: a failure here must not turn into a sign-out.
    let facilityName: string | null = facility?.display ?? profileFacility?.display ?? null
    if (facility && !facilityName) {
      try {
        const org = await fetch(medplumUrl(`fhir/R4/${facility.reference}`), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (org.ok) facilityName = (await org.json())?.name ?? null
      } catch (error) {
        console.warn("[auth/me] could not read facility name", error)
      }
    }

    return NextResponse.json(
      {
        id: profile.id ?? null,
        resourceType: profile.resourceType ?? null,
        name: displayName || "Signed-in user",
        email: profile.telecom?.find((t: { system?: string }) => t.system === "email")?.value ?? null,
        admin: isProjectAdmin,
        project: body?.project?.name ?? null,
        // Membership binding first (it is what the AccessPolicy actually
        // parameterises); the Practitioner's own facility stamp is the fallback.
        facilityId:
          (facility?.reference ?? profileFacility?.reference)?.split("/")[1] ?? null,
        facilityName,
        roleTags,
        mustChangePassword,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[auth/me] request failed", error)
    return unreachable()
  }
}
