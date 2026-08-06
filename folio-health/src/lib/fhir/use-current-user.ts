"use client"

import { useQuery } from "@tanstack/react-query"

export interface CurrentUser {
  id: string | null
  resourceType: string | null
  name: string
  email: string | null
  admin: boolean
  project: string | null
}

/**
 * The signed-in Medplum user.
 *
 * This replaces `getStaffByRole(activeRole)[0]` from the mock layer, which
 * showed whichever fake staff member matched the locally-selected role — so the
 * shell displayed "Noel Parker" no matter who had actually authenticated.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<CurrentUser> => {
      const response = await fetch("/api/auth/me")
      if (!response.ok) throw new Error("Not authenticated")
      return (await response.json()) as CurrentUser
    },
  })
}
