import { NextResponse } from "next/server"
import { medplumUrl } from "@/lib/medplum/config"
import { clearTokens, getAccessToken } from "@/lib/medplum/session"

/**
 * Sign out: revoke the session on Medplum, then drop the local token cookies.
 * The cookies are cleared even if the revoke call fails, so a server problem
 * can never leave a browser holding a live session.
 */
export async function POST() {
  const accessToken = await getAccessToken()

  if (accessToken) {
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
  return NextResponse.json({ ok: true })
}
