import { NextResponse } from "next/server"
import { medplumUrl } from "@/lib/medplum/config"
import { clearTempCredentialFlag } from "@/lib/medplum/service"
import { clearTokens, getAccessToken, refreshAccessToken } from "@/lib/medplum/session"
import { MUST_CHANGE_PASSWORD_COOKIE } from "@/lib/session"

/**
 * Change the signed-in user's password.
 *
 * Medplum re-verifies the current password itself, so this route never decides
 * whether the change is allowed — it forwards the attempt with the caller's own
 * token and relays the outcome.
 *
 * Two Medplum behaviours shape the ordering here, both confirmed empirically
 * (Folio-Web `docs/forced-change-findings.md`):
 *
 *   Wall #2 — `/auth/changepassword` revokes EVERY Login for the user. The
 *   caller's own token dies mid-request, so the profile must be resolved BEFORE
 *   the change, and the session cookies must be cleared after it. The user
 *   re-authenticates with the new password.
 *
 *   Wall #3 — the login created by that re-authentication is refused
 *   `Bot/$execute`, so the user's session can never clear its own first-login
 *   flag. A service credential does it here instead, which is the only actor
 *   independent of the revoked session.
 *
 * If the flag is not cleared, the user is asked to set a password again on their
 * next sign-in — an endless loop. So a clearing failure is reported loudly
 * rather than swallowed, even though the password change itself succeeded.
 */

const MIN_PASSWORD_LENGTH = 8

interface AuthMeResponse {
  profile?: { resourceType?: string; id?: string }
}

/** Resolve the caller's Practitioner id while their token is still alive. */
async function resolvePractitionerId(token: string): Promise<string | null> {
  try {
    const response = await fetch(medplumUrl("auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!response.ok) return null
    const me = (await response.json()) as AuthMeResponse
    if (me.profile?.resourceType !== "Practitioner") return null
    return me.profile.id ?? null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  let oldPassword: string
  let newPassword: string

  try {
    const body = await request.json()
    oldPassword = String(body.oldPassword ?? "")
    newPassword = String(body.newPassword ?? "")
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!oldPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are both required." },
      { status: 400 }
    )
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    )
  }

  // Rejected here rather than by Medplum: re-submitting the temporary password
  // would otherwise "succeed" and clear the flag, leaving the operator-known
  // credential in place as if it were permanent.
  if (oldPassword === newPassword) {
    return NextResponse.json(
      { error: "Your new password must be different from your current one." },
      { status: 400 }
    )
  }

  let token = await getAccessToken()
  if (!token) token = await refreshAccessToken()
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  // BEFORE the change — this token stops working the moment Medplum accepts it.
  const practitionerId = await resolvePractitionerId(token)

  try {
    const response = await fetch(medplumUrl("auth/changepassword"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
      cache: "no-store",
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      const detail = body?.issue?.[0]?.details?.text
      return NextResponse.json(
        { error: detail ?? "Could not change your password." },
        { status: response.status }
      )
    }

    // The password is now changed. Everything below is cleanup — none of it can
    // undo the change, so failures are reported, never retried destructively.

    let flagCleared = true
    let flagWarning: string | undefined

    if (practitionerId) {
      const cleared = await clearTempCredentialFlag(practitionerId)
      if (cleared.status === "unavailable" || cleared.status === "failed") {
        flagCleared = false
        flagWarning = cleared.reason
        console.error(
          "[auth/change-password] password changed but the first-login flag was NOT cleared " +
            `for Practitioner/${practitionerId}: ${cleared.reason}`
        )
      }
    } else if (practitionerId === null) {
      // A non-Practitioner profile never carries the flag, so there is nothing to
      // clear — but if resolution merely failed, the flag may still be set. The
      // two are indistinguishable from here, so warn rather than claim success.
      flagCleared = false
      flagWarning =
        "Your password was changed, but your profile could not be read to clear the " +
        "first-login flag. If you are asked to set a password again, contact your administrator."
    }

    // Medplum revoked this session during the change — drop the dead cookies so
    // the app shows a sign-in page rather than a broken authenticated shell.
    await clearTokens()

    const json = NextResponse.json({
      ok: true,
      // The client uses this to send the user to sign in with the new password.
      reauthenticationRequired: true,
      flagCleared,
      ...(flagWarning ? { warning: flagWarning } : {}),
    })
    json.cookies.delete(MUST_CHANGE_PASSWORD_COOKIE)
    return json
  } catch (error) {
    console.error("[auth/change-password] request failed", error)
    return NextResponse.json({ error: "Could not reach Folio." }, { status: 502 })
  }
}
