"use client"

import { useMemo } from "react"
import { NAV_SECTIONS, type NavSection } from "@/config/nav"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { PLATFORM_NAV_HREFS } from "./roles"

/** Surfaces that belong to the platform plane and are hidden from facility users. */
const PLATFORM_ONLY_HREFS = ["/facilities"]

/**
 * The nav for the signed-in user.
 *
 * The platform operator runs the network, not the chart, so their sidebar is an
 * allow-list of platform surfaces — every clinical and facility-operational
 * module is hidden. Facility users conversely never see the cross-facility
 * Hospitals list.
 *
 * Returns `null` while the session is still resolving so the shell can hold off
 * rendering rather than flashing the full clinical nav and then collapsing it.
 */
export function useScopedNav(): NavSection[] | null {
  const { data: user, isLoading, isError } = useCurrentUser()

  return useMemo(() => {
    if (isLoading) return null
    // Not signed in / profile unavailable: render nothing rather than guessing.
    if (isError || !user) return []

    const allowed = (href: string) =>
      user.platformOnly ? PLATFORM_NAV_HREFS.includes(href) : !PLATFORM_ONLY_HREFS.includes(href)

    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed(item.href)),
    })).filter((section) => section.items.length > 0)
  }, [user, isLoading, isError])
}
