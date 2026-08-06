"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { platformCanAccess } from "@/lib/auth/roles"

/**
 * Keeps the operator plane out of clinical routes.
 *
 * Hiding nav items is not access control — a URL typed straight into the bar
 * would still render the screen. This blocks the render.
 *
 * It is still only the CLIENT half. The real boundary is the server-side
 * Medplum AccessPolicy: a platform-admin membership should carry no clinical
 * PHI grant, so even a bypassed UI returns nothing. Until that policy is
 * installed (docs/auth-tenancy-keystone.md Phase 2), this guard is the only
 * thing standing between the operator and the chart — treat it as a stopgap,
 * not the wall.
 */
function PlaneGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { data: user, isLoading } = useCurrentUser()

  // Don't flash clinical content while the session resolves.
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

  return <>{children}</>
}

export { PlaneGuard }
