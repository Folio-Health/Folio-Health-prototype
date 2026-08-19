"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useUiStore } from "@/stores/ui-store"
import { platformCanAccess, facilityRouteAllowed } from "@/lib/auth/roles"

/**
 * Blocks rendering a route the signed-in user's role can't open.
 *
 * Hiding nav items is not access control — a URL typed straight into the bar
 * would still render the screen. This blocks the render, for both halves of
 * the trust model: the operator plane kept out of clinical routes (as
 * before), and now each facility role kept out of routes ROLE_NAV_HREFS
 * doesn't grant it (e.g. a doctor opening /administration/users by URL used
 * to render the full staff directory despite it never appearing in their
 * sidebar).
 *
 * It is still only the CLIENT half. The real boundary is the server-side
 * Medplum AccessPolicy: a platform-admin membership should carry no clinical
 * PHI grant, so even a bypassed UI returns nothing. Until that policy is
 * installed (docs/auth-tenancy-keystone.md Phase 2), this guard is the only
 * thing standing between an out-of-scope role and the page — treat it as a
 * stopgap, not the wall.
 */
function PlaneGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { data: user, isLoading } = useCurrentUser()
  const previewRole = useUiStore((s) => s.previewRole)

  // Don't flash protected content while the session resolves.
  if (isLoading) return null

  if (user?.platformOnly && !platformCanAccess(pathname)) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Not available on a platform account"
        description="This account administers facilities and identities. Clinical records belong to each facility and are not accessible from the platform plane."
        action={
          <Button size="sm" render={<Link href="/facilities" />}>
            Go to Facilities
          </Button>
        }
      />
    )
  }

  const effectiveRoles = previewRole ? [previewRole] : (user?.roles ?? [])
  if (user && !user.platformOnly && !facilityRouteAllowed(pathname, effectiveRoles)) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="You don't have permission to access this section"
        description="This page isn't part of your role. If you think that's wrong, ask your facility administrator."
        action={
          <Button size="sm" render={<Link href="/dashboard" />}>
            Back to Dashboard
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}

export { PlaneGuard }
