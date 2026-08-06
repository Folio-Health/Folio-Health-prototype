import { NextResponse } from "next/server"
import { medplumUrl } from "@/lib/medplum/config"
import { getAccessToken, refreshAccessToken } from "@/lib/medplum/session"

/**
 * Change the signed-in user's password.
 *
 * Medplum re-verifies the current password itself, so this route never decides
 * whether the change is allowed — it forwards the attempt with the caller's own
 * token and relays the outcome.
 */
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

  let token = await getAccessToken()
  if (!token) token = await refreshAccessToken()
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

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

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[auth/change-password] request failed", error)
    return NextResponse.json({ error: "Could not reach Folio." }, { status: 502 })
  }
}
