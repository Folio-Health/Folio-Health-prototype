"use client"

import { useMemo } from "react"
import { NAV_SECTIONS, type NavSection } from "@/config/nav"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useUiStore } from "@/stores/ui-store"
import { PLATFORM_NAV_HREFS, ROLE_NAV_HREFS, type RoleId } from "./roles"

/**
 * The nav for the signed-in user.
 *
 * The platform operator runs the network, not the chart, so their sidebar is an
 * allow-list of platform surfaces — every clinical and facility-operational
 * module is hidden.
 *
 * Facility users get the union of every role they hold (a user can carry more
 * than one role tag), via the per-role allow-lists in ROLE_NAV_HREFS — unless
 * "preview as role" (see profile-menu.tsx) is active, in which case the nav
 * reflects the previewed role instead, matching what DashboardView already
 * does for the dashboard itself. A facility user with an unrecognized or
 * empty role set falls back to the full facility nav — matching
 * reconcileRoles()'s own "provisioning gap, not a decision" stance: until
 * every account is actually role-tagged, an unknown role should not silently
 * lock someone out of their own sidebar.
 *
 * Returns `null` while the session is still resolving so the shell can hold off
 * rendering rather than flashing the full clinical nav and then collapsing it.
 */
export function useScopedNav(): NavSection[] | null {
  const { data: user, isLoading, isError } = useCurrentUser()
  const previewRole = useUiStore((s) => s.previewRole)

  return useMemo(() => {
    if (isLoading) return null
    // Not signed in / profile unavailable: render nothing rather than guessing.
    if (isError || !user) return []

    const allowed = (href: string) => {
      if (user.platformOnly) return PLATFORM_NAV_HREFS.includes(href)

      if (previewRole) return ROLE_NAV_HREFS[previewRole]?.includes(href) ?? false

      const roles = (user.roles ?? []).filter(
        (r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin"
      )
      // No recognized role tag yet: permissive fallback, see doc comment above.
      if (roles.length === 0) return true

      return roles.some((role) => ROLE_NAV_HREFS[role]?.includes(href))
    }

    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed(item.href)),
    })).filter((section) => section.items.length > 0)
  }, [user, isLoading, isError, previewRole])
}
