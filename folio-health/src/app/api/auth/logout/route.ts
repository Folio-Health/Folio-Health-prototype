import { NextResponse } from "next/server"
import { DEMO_TOKEN_PREFIX } from "@/lib/demo/mode"
import { medplumUrl } from "@/lib/medplum/config"
import { clearTokens, getAccessToken } from "@/lib/medplum/session"
import { MUST_CHANGE_PASSWORD_COOKIE } from "@/lib/session"

/**
 * Sign out: revoke the session on Medplum, then drop the local token cookies.
 * The cookies are cleared even if the revoke call fails, so a server problem
 * can never leave a browser holding a live session.
 */
export async function POST() {
  const accessToken = await getAccessToken()

  // Demo sessions exist only in this browser's cookie — nothing to revoke.
  if (accessToken && !accessToken.startsWith(DEMO_TOKEN_PREFIX)) {
    try {
      await fetch(medplumUrl("auth/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      })
    } catch (error) {
      console.error("[auth/logout] Medplum revoke failed; clearing cookies anyway", error)
    }
  }

  await clearTokens()

  const response = NextResponse.json({ ok: true })
  // Left behind, this would gate the NEXT person to sign in on this browser
  // behind a password change that isn't theirs.
  response.cookies.delete(MUST_CHANGE_PASSWORD_COOKIE)
  return response
}
