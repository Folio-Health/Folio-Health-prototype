"use client"

import { useQuery } from "@tanstack/react-query"
import { isPlatformOnly, reconcileRoles, type RoleId } from "@/lib/auth/roles"

export interface CurrentUser {
  id: string | null
  resourceType: string | null
  name: string
  email: string | null
  /** ProjectMembership.admin — server-held, grants the platform plane. */
  admin: boolean
  project: string | null
  facilityId: string | null
  facilityName: string | null
  /** Untrusted role tags from the Practitioner. */
  roleTags: string[]
}

export interface CurrentUserWithRoles extends CurrentUser {
  /** Roles after reconciling the untrusted tags against trusted signals. */
  roles: RoleId[]
  /** Platform plane only — no clinical role, so no clinical surfaces. */
  platformOnly: boolean
}

/**
 * The signed-in Medplum user and their effective roles.
 *
 * Replaces `getStaffByRole(activeRole)[0]` from the mock layer, which showed
 * whichever fake staff member matched a locally-selected role — so the shell
 * displayed "Noel Parker" regardless of who had actually authenticated, and
 * every user saw every module.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<CurrentUserWithRoles> => {
      const response = await fetch("/api/auth/me")
      if (!response.ok) throw new Error("Not authenticated")
      const user = (await response.json()) as CurrentUser
      const roles = reconcileRoles(user.roleTags ?? [], user.admin, Boolean(user.facilityId))
      return { ...user, roles, platformOnly: isPlatformOnly(roles) }
    },
  })
}
