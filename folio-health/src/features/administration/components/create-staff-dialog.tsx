"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CopyIcon, Loader2Icon, TriangleAlertIcon, UserPlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FACILITY_ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/auth/roles"

interface Created {
  name: string
  email: string
  role: string
  roleLabel: string
  facility: string
  tempPassword: string
}

/**
 * Create a clinical staff account for the signed-in administrator's facility.
 *
 * Mirrors the operator's hospital-admin dialog: the temporary password is
 * generated server-side, shown ONCE, never emailed and never stored anywhere
 * retrievable. The account is flagged so its holder must set a permanent
 * password before Folio opens for them.
 *
 * The facility is taken from the signed-in user, never from a picker — the
 * server pins a facility administrator to their own facility regardless, and
 * offering a choice the server would refuse is a lie in the UI.
 */
function CreateStaffDialog({
  facilityId,
  facilityName,
  onCreated,
}: {
  facilityId: string
  facilityName: string | null
  onCreated?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [created, setCreated] = useState<Created | null>(null)

  function close() {
    setOpen(false)
    // Drop the credential from memory as soon as the dialog is dismissed.
    setCreated(null)
    setFirstName("")
    setLastName("")
    setEmail("")
    setRole("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!role) {
      toast.error("Choose a role for this staff member")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(
        `/api/admin/facilities/${encodeURIComponent(facilityId)}/staff`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, email, role }),
        }
      )
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? "Could not create the staff account.")
      setCreated(body as Created)
      toast.success("Staff account created")
      onCreated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the staff account")
    } finally {
      setSaving(false)
    }
  }

  async function copyPassword() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.tempPassword)
      toast.success("Temporary password copied")
    } catch {
      toast.error("Could not copy — select the password and copy it manually")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogTrigger render={<Button />}>
        <UserPlusIcon />
        Add staff
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Staff account created</DialogTitle>
              <DialogDescription>
                {created.name} joins {created.facility} as {created.roleLabel}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label>Sign-in email</Label>
                <p className="font-mono text-sm text-foreground">{created.email}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Temporary password</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
                    {created.tempPassword}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
                    <CopyIcon className="size-4" />
                  </Button>
                </div>
              </div>

              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
              >
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Shown once and not stored — copy it now. Hand it over in person; it was
                  deliberately not emailed. Folio will not open for them until they replace it.
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={close}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add staff</DialogTitle>
              <DialogDescription>
                Creates a Folio account for {facilityName ?? "your facility"}. They sign in with
                a temporary password and must set their own before they can use the system.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="staff-first">First name</Label>
                  <Input
                    id="staff-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="staff-last">Last name</Label>
                  <Input
                    id="staff-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.health"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is their sign-in identity. A temporary password is generated for you to
                  hand over.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Determines what they can see and do. Enforced by Folio&apos;s server, not by
                  this screen.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2Icon className="size-4 animate-spin" />}
                Create account
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { CreateStaffDialog }
