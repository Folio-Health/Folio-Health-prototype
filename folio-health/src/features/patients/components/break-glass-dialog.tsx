"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SirenIcon, ShieldAlertIcon, Loader2Icon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMERGENCY_REASONS = [
  { value: "unconscious", label: "Unconscious or incapacitated patient" },
  { value: "unidentified", label: "Unidentified emergency patient" },
  { value: "allergy", label: "Urgent allergy confirmation needed" },
  { value: "treatment-history", label: "Urgent treatment-history confirmation needed" },
  { value: "other", label: "Other clinical emergency" },
] as const

const MIN_JUSTIFICATION_LENGTH = 20

/**
 * Emergency ("break-glass") access request (EMR V1 RBAC spec §23–24).
 *
 * Doctor/nurse only — enforced by the caller via RoleGate, not here.
 *
 * This is a UI-only request flow. There is no backend yet that actually
 * widens what the signed-in user's AccessPolicy allows, verifies the
 * password, or records anything durable — confirming here does not unlock
 * any additional data. The copy below says this plainly rather than
 * describing behaviour (auto-expiry, audit logging, reviewer notification)
 * that doesn't exist yet in this build.
 */
function BreakGlassDialog({
  patientName,
  open,
  onOpenChange,
}: {
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = useState("")
  const [reason, setReason] = useState<string>("")
  const [justification, setJustification] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const justificationLength = justification.trim().length
  const justificationOk = justificationLength >= MIN_JUSTIFICATION_LENGTH
  const canSubmit = password.length > 0 && reason.length > 0 && justificationOk

  function reset() {
    setPassword("")
    setReason("")
    setJustification("")
    setSubmitting(false)
  }

  async function handleConfirm() {
    setSubmitting(true)
    // Simulated latency only — there is no request to send yet. See the
    // component doc comment: this demonstrates the flow, it does not grant
    // access or record anything durable. Kept brief (not the 700ms this
    // used to be) — there's nothing real to wait for, and stacking that
    // delay in front of the toast's own ~1s entrance made confirmation feel
    // broken rather than just simulated.
    await new Promise((resolve) => setTimeout(resolve, 150))
    setSubmitting(false)
    onOpenChange(false)
    reset()
    toast.success(`Emergency access request captured for ${patientName}`, {
      description: "This is a UI demonstration — no backend exists yet to act on or store this request.",
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <SirenIcon className="size-5" />
          </div>
          <DialogTitle>Request emergency access</DialogTitle>
          <DialogDescription>
            For {patientName}. Use this only when normal access would delay urgent care — not out of
            curiosity, and not because the normal assignment process is inconvenient.
          </DialogDescription>
        </DialogHeader>

        {/* method="post" is a pre-hydration safety net — see (auth)/login/page.tsx. */}
        <form
          method="post"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit && !submitting) void handleConfirm()
          }}
        >
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              This screen demonstrates the intended flow only — it isn&apos;t connected to a real
              access-granting backend yet. In the finished system, access granted this way would be
              limited to this one patient, expire automatically, stay blocked from printing, bulk
              export, deletion, and role administration, and generate an immediate audit event.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="break-glass-password">Confirm your password</Label>
            <Input
              id="break-glass-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Re-enter your password to continue"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="break-glass-reason">Reason</Label>
            <Select value={reason} onValueChange={(value) => setReason(value ?? "")}>
              <SelectTrigger id="break-glass-reason">
                <SelectValue placeholder="Select an emergency reason">
                  {(value: string | null) =>
                    EMERGENCY_REASONS.find((r) => r.value === value)?.label ?? "Select an emergency reason"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EMERGENCY_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="break-glass-justification">Justification</Label>
            <Textarea
              id="break-glass-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Briefly describe the emergency and why normal access isn't available in time"
              rows={3}
            />
            <p
              className={
                justificationOk
                  ? "flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                  : "text-xs text-muted-foreground"
              }
            >
              {justificationOk ? (
                <>
                  <CheckIcon className="size-3.5" />
                  {justificationLength} characters
                </>
              ) : (
                `${justificationLength}/${MIN_JUSTIFICATION_LENGTH} characters minimum`
              )}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!canSubmit || submitting}>
              {submitting && <Loader2Icon className="size-4 animate-spin" />}
              Confirm emergency access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { BreakGlassDialog }
