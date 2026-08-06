"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2Icon, PlusIcon } from "lucide-react"
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

/** Register a facility. The tenant boundary, so operator-plane only. */
function AddFacilityDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

  function reset() {
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const response = await fetch("/api/admin/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? "Could not create the facility.")

      toast.success(`${body.name} registered`)
      await queryClient.invalidateQueries({ queryKey: ["facilities"] })
      await queryClient.invalidateQueries({ queryKey: ["platform-metrics"] })
      await queryClient.invalidateQueries({ queryKey: ["facility-registrations"] })
      reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the facility")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add facility
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register a facility</DialogTitle>
            <DialogDescription>
              A facility is a tenant: its records are owned by it and visible only to its
              staff. You can add its administrator once it exists.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="facility-name">Facility name</Label>
              <Input
                id="facility-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ikeja Family Clinic"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="facility-phone">Phone</Label>
                <Input
                  id="facility-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="facility-email">Email</Label>
                <Input
                  id="facility-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="facility-address">Address</Label>
              <Input
                id="facility-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Register facility
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { AddFacilityDialog }
