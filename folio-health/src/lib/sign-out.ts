"use client"

import type { useRouter } from "next/navigation"
import type { QueryClient } from "@tanstack/react-query"
import { useUiStore } from "@/stores/ui-store"

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
 *
 * Client state is wiped too: the React Query cache still holds the outgoing
 * user's identity (useCurrentUser has a 5-minute staleTime), so without a
 * clear the NEXT account briefly renders the previous user's name, nav and
 * plane. Same for the persisted "preview as role" override — a preview
 * belongs to the person who chose it, not to whoever signs in next.
 */
export async function signOut(router: Router, queryClient?: QueryClient): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    // Even if the revoke call fails the cookies are cleared server-side on a
    // best-effort basis; still send the user to the login screen.
  }
  useUiStore.getState().setPreviewRole(null)
  queryClient?.clear()
  router.replace("/login")
  router.refresh()
}
