"use client"

import type { useRouter } from "next/navigation"

type Router = ReturnType<typeof useRouter>

/**
 * Ends the session: revokes it on Medplum and clears the httpOnly token
 * cookies, then navigates.
 *
 * Navigation happens only AFTER the cookies are gone. The previous logout put
 * the cookie clear in an `onClick` while a `<Link href="/login">` navigated in
 * the same tick — so Next could prefetch /login while still authenticated,
 * cache the "redirect to /dashboard" response, and bounce the user back into
 * the app on click.
 */
export async function signOut(router: Router): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    // Even if the revoke call fails the cookies are cleared server-side on a
    // best-effort basis; still send the user to the login screen.
  }
  router.replace("/login")
  router.refresh()
}
