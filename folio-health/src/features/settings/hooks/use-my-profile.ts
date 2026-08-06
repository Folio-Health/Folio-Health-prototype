"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Practitioner } from "@medplum/fhirtypes"
import { readResource, updateResource } from "@/lib/fhir/client"

export interface ProfileEdit {
  name: string
  phone: string
}

/**
 * Update the signed-in user's own Practitioner record.
 *
 * Email is deliberately not editable here: it is the Medplum login identity,
 * held on the User resource rather than the Practitioner, so changing it on the
 * Practitioner would only desynchronise the two.
 */
export function useUpdateMyProfile(practitionerId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (edit: ProfileEdit) => {
      if (!practitionerId) throw new Error("No practitioner profile to update")
      const current = await readResource<Practitioner>("Practitioner", practitionerId)

      const trimmed = edit.name.trim()
      const parts = trimmed.split(/\s+/)
      const family = parts.length > 1 ? parts[parts.length - 1] : undefined
      const given = parts.length > 1 ? parts.slice(0, -1) : parts

      const telecom = [
        ...(edit.phone.trim() ? [{ system: "phone" as const, value: edit.phone.trim() }] : []),
        // Keep every contact point this form does not own, email included.
        ...(current.telecom ?? []).filter((t) => t.system !== "phone"),
      ]

      return updateResource<Practitioner>({
        ...current,
        name: trimmed ? [{ given, family, text: trimmed }] : current.name,
        telecom,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
  })
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? "Could not change your password.")
  }
}
