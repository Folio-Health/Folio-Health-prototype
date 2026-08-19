"use client"

import type { ReactNode } from "react"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useUiStore } from "@/stores/ui-store"
import { can, type Permission } from "@/lib/auth/permissions"
import type { RoleId } from "@/lib/auth/roles"

interface RoleGateProps {
  /** Render children only if the signed-in user holds this permission. */
  permission?: Permission
  /** Render children only if the signed-in user holds one of these roles. */
  roles?: RoleId[]
  children: ReactNode
  /** Rendered instead of nothing while access is denied. */
  fallback?: ReactNode
}

/**
 * UI-layer gate for a single consequential action — a button, a menu item,
 * a form control. Hides `children` unless the signed-in user's role or
 * permission allows the action.
 *
 * This is NOT the security boundary (see src/lib/auth/permissions.ts) — it
 * exists so a role that has no business performing an action is never even
 * offered it, not so the action is actually blocked if someone bypasses the
 * UI. The server-side Medplum AccessPolicy is what actually enforces this.
 *
 * Respects "preview as role" (see profile-menu.tsx) the same way the nav and
 * dashboard do — while previewing, every gate in the app reflects the
 * previewed role instead of the real one, so what you see while previewing
 * matches what that role would actually be offered.
 *
 * While the session is still resolving, renders nothing rather than
 * flashing an action the user may not be allowed to see.
 */
function RoleGate({ permission, roles, children, fallback = null }: RoleGateProps) {
  const { data: user, isLoading } = useCurrentUser()
  const previewRole = useUiStore((s) => s.previewRole)
  if (isLoading) return null

  const userRoles: RoleId[] = previewRole ? [previewRole] : (user?.roles ?? [])
  if (permission && !can(userRoles, permission)) return fallback
  if (roles && !roles.some((role) => userRoles.includes(role))) return fallback

  return children
}

export { RoleGate }
