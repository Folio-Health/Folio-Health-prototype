"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2Icon, PowerIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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

interface StaffAccount {
  id: string
  name: string
  active: boolean
}

/**
 * Activate / deactivate a facility, optionally cutting its staff's access.
 *
 * The two are separated because they are genuinely different acts. Marking a
 * facility inactive is bookkeeping. Disabling its accounts locks real
 * clinicians out of real charts, so it is opt-in, it names every person
 * affected before you confirm, and it is reversible.
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
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changeAccess, setChangeAccess] = useState(true)

  // Only fetched once the dialog opens — this is a confirmation aid, not
  // something every page load should pay for.
  const staff = useQuery({
    queryKey: ["facility-staff", facilityId],
    enabled: open,
    queryFn: async (): Promise<{
      staff: StaffAccount[]
      activeCount: number
      truncated: boolean
    }> => {
      const response = await fetch(`/api/admin/facilities/${facilityId}/staff`)
      if (!response.ok) throw new Error("Could not load facility staff")
      return response.json()
    },
  })

  async function submit() {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active, revokeAccess: changeAccess }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? "Could not update the facility status.")

      const accounts = body.accountsChanged ?? 0
      const suffix = accounts
        ? ` · ${accounts} account${accounts === 1 ? "" : "s"} ${active ? "disabled" : "re-enabled"}`
        : ""
      toast.success(`${facilityName} ${active ? "deactivated" : "reactivated"}${suffix}`)

      if (body.accountsFailed) {
        toast.error(
          `${body.accountsFailed} account${body.accountsFailed === 1 ? "" : "s"} could not be updated — check and retry.`
        )
      }

      await queryClient.invalidateQueries({ queryKey: ["facility", facilityId] })
      await queryClient.invalidateQueries({ queryKey: ["facility-staff", facilityId] })
      await queryClient.invalidateQueries({ queryKey: ["facilities"] })
      await queryClient.invalidateQueries({ queryKey: ["platform-metrics"] })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the facility status")
    } finally {
      setSaving(false)
    }
  }

  const accounts = staff.data?.staff ?? []
  const affected = active
    ? accounts.filter((a) => a.active)
    : accounts.filter((a) => !a.active)

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

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 rounded-lg border border-border p-3">
            <Checkbox
              id="revoke-access"
              checked={changeAccess}
              onCheckedChange={(checked) => setChangeAccess(checked === true)}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="revoke-access" className="cursor-pointer text-sm font-medium">
                {active
                  ? "Also disable staff accounts at this facility"
                  : "Also re-enable staff accounts at this facility"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {active
                  ? "Without this, marking the facility inactive is only a label — its staff can still sign in and open patient records."
                  : "Restores sign-in for accounts that were disabled when this facility was deactivated."}
              </p>
            </div>
          </div>

          {changeAccess && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              {staff.isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  Checking which accounts are affected…
                </span>
              ) : staff.isError ? (
                <span>Could not load the staff list — continue only if you are sure.</span>
              ) : affected.length === 0 ? (
                <span>No accounts at this facility will change.</span>
              ) : (
                <div className="flex items-start gap-2.5">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <span>
                      <strong>
                        {affected.length} account{affected.length === 1 ? "" : "s"}
                      </strong>{" "}
                      will {active ? "lose access immediately" : "regain access"}:
                    </span>
                    <ul className="list-inside list-disc">
                      {affected.slice(0, 6).map((account) => (
                        <li key={account.id}>{account.name}</li>
                      ))}
                      {affected.length > 6 && <li>and {affected.length - 6} more</li>}
                    </ul>
                    {active && <span>This can be undone by reactivating the facility.</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void submit()
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
