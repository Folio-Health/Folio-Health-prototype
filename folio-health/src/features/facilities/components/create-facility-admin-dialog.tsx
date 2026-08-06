"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CopyIcon, Loader2Icon, UserPlusIcon, TriangleAlertIcon } from "lucide-react"
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

interface Created {
  name: string
  email: string
  facility: string
  tempPassword: string
}

/**
 * Create the facility's administrator.
 *
 * The temporary password is generated server-side and shown ONCE. It is not
 * emailed (clinic email is unreliable, and a mailed credential is a credential
 * in transit) and not stored anywhere retrievable — hand it over in person. The
 * account is flagged so the holder must replace it at first sign-in.
 */
function CreateFacilityAdminDialog({
  facilityId,
  facilityName,
}: {
  facilityId: string
  facilityName: string
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [created, setCreated] = useState<Created | null>(null)

  function close() {
    setOpen(false)
    // Clear the credential from memory as soon as the dialog is dismissed.
    setCreated(null)
    setFirstName("")
    setLastName("")
    setEmail("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch("/api/admin/facility-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, firstName, lastName, email }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? "Could not create the hospital admin.")
      setCreated(body as Created)
      toast.success("Hospital admin created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the hospital admin")
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
      <DialogTrigger render={<Button variant="outline" />}>
        <UserPlusIcon />
        Add hospital admin
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Hospital admin created</DialogTitle>
              <DialogDescription>
                {created.name} can now administer {created.facility}.
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
                  deliberately not emailed. They must change it at first sign-in.
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
              <DialogTitle>Add hospital admin</DialogTitle>
              <DialogDescription>
                They will administer {facilityName} — provisioning its doctors, nurses, front
                desk and finance staff. They get no clinical access from this role.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-first">First name</Label>
                  <Input
                    id="admin-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-last">Last name</Label>
                  <Input
                    id="admin-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clinic.health"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is their sign-in identity. A temporary password is generated for you to
                  hand over.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2Icon className="size-4 animate-spin" />}
                Create admin
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { CreateFacilityAdminDialog }
