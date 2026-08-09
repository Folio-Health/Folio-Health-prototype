"use client"

import { useQuery } from "@tanstack/react-query"

/**
 * The real staff accounts for one facility, straight from Medplum.
 *
 * Replaces the mock `STAFF` array the users page used to render, which showed
 * the same invented people to every facility and could not reflect an account
 * that had actually been created.
 */

export interface FacilityStaffMember {
  /** ProjectMembership id — the thing that gets activated or deactivated. */
  id: string
  name: string
  email: string | null
  role: string | null
  roleLabel: string | null
  active: boolean
  admin: boolean
  practitionerId?: string
  /** Still on their first-login temporary password. */
  mustChangePassword: boolean
}

export interface FacilityStaffResponse {
  staff: FacilityStaffMember[]
  activeCount: number
  /** The list was capped — it understates who actually has access. */
  truncated: boolean
}

export function useFacilityStaff(facilityId: string | null) {
  return useQuery({
    queryKey: ["facility-staff", facilityId],
    // Without a facility there is nothing to scope the query to; the platform
    // operator manages accounts from the Facilities page instead.
    enabled: Boolean(facilityId),
    queryFn: async (): Promise<FacilityStaffResponse> => {
      const response = await fetch(
        `/api/admin/facilities/${encodeURIComponent(facilityId!)}/staff`
      )
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error ?? "Could not load staff for this facility.")
      }
      return body as FacilityStaffResponse
    },
  })
}
