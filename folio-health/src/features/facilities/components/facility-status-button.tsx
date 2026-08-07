"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2Icon, PowerIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * Activate / deactivate a facility.
 *
 * The confirmation spells out the limit rather than implying a security
 * boundary: `Organization.active` is a record flag, and Medplum scopes users
 * through their membership's %organization parameter without ever consulting
 * it. Deactivating marks the tenant closed; it does not lock its staff out.
 */
function FacilityStatusButton({
  facilityId,
  facilityName,
  active,
}: {
  facilityId: string
  facilityName: string
  active: boolean
}) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  async function toggle() {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? "Could not update the facility status.")

      toast.success(active ? `${facilityName} deactivated` : `${facilityName} reactivated`)
      await queryClient.invalidateQueries({ queryKey: ["facility", facilityId] })
      await queryClient.invalidateQueries({ queryKey: ["facilities"] })
      await queryClient.invalidateQueries({ queryKey: ["platform-metrics"] })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the facility status")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant={active ? "outline" : "default"} />}>
        <PowerIcon />
        {active ? "Deactivate" : "Reactivate"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {active ? `Deactivate ${facilityName}?` : `Reactivate ${facilityName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {active
              ? "The facility will be marked as no longer in active use and will show as Inactive across the platform."
              : "The facility will be marked as in active use again."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {active && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              This does <strong>not</strong> revoke access. Staff at this facility can still
              sign in and reach its records, because access is granted by their account, not
              by this flag. To stop access, disable their accounts as well.
            </span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void toggle()
            }}
            disabled={saving}
          >
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {active ? "Deactivate" : "Reactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { FacilityStatusButton }
