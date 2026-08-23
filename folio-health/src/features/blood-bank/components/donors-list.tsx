"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { phoneInputProps, sanitizePhoneInput } from "@/lib/phone"
import { format } from "date-fns"
import { PlusIcon, SearchIcon, MailIcon, PhoneIcon, DropletIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DONORS, BLOOD_GROUPS, type Donor } from "@/lib/mock/blood-bank"
import type { BloodGroup } from "@/types/core"
import { getDonorColumns } from "./donor-columns"

const ALL = "all"
const EMPTY_FORM = { name: "", phone: "", email: "" }

function DonorsList() {
  const [donors, setDonors] = useState<Donor[]>(DONORS)
  const [search, setSearch] = useState("")
  const [bloodType, setBloodType] = useState(ALL)
  const [eligibility, setEligibility] = useState(ALL)
  const [viewing, setViewing] = useState<Donor | null>(null)

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formBloodType, setFormBloodType] = useState<BloodGroup>(BLOOD_GROUPS[0])
  const [formGender, setFormGender] = useState<"Male" | "Female">("Female")

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      if (bloodType !== ALL && d.bloodType !== bloodType) return false
      if (eligibility === "eligible" && !d.eligible) return false
      if (eligibility === "ineligible" && d.eligible) return false
      if (search) {
        const q = search.toLowerCase()
        if (!d.name.toLowerCase().includes(q) && !d.phone.includes(q) && !d.id.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [donors, search, bloodType, eligibility])

  function handleScheduleDonation(donor: Donor) {
    toast.success(`Donation scheduled for ${donor.name}`, {
      description: "They will be contacted to confirm an appointment slot.",
    })
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setFormBloodType(BLOOD_GROUPS[0])
    setFormGender("Female")
  }

  function handleRegisterDonor() {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    const newDonor: Donor = {
      id: `DNR-local-${Date.now()}`,
      name: form.name.trim(),
      bloodType: formBloodType,
      gender: formGender,
      phone: form.phone.trim(),
      email: form.email.trim(),
      lastDonationDate: null,
      totalDonations: 0,
      eligible: true,
      avatarSeed: form.name.trim(),
    }
    setDonors((prev) => [newDonor, ...prev])
    toast.success(`${newDonor.name} registered as a donor`)
    resetForm()
    setAdding(false)
  }

  const columns = getDonorColumns({ onView: setViewing, onScheduleDonation: handleScheduleDonation })

  return (
    <div>
      <PageHeader
        title="Donor Directory"
        description={`${donors.length} registered donors`}
        breadcrumbs={[
          { label: "Diagnostics" },
          { label: "Blood Bank", href: "/blood-bank" },
          { label: "Donors" },
        ]}
        actions={
          <Button onClick={() => setAdding(true)}>
            <PlusIcon />
            Register Donor
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(donor) => setViewing(donor)}
        emptyTitle="No donors found"
        emptyDescription="Try adjusting your search or filters, or register a new donor."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name, ID, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={bloodType} onValueChange={(v) => setBloodType(v ?? ALL)}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Groups</SelectItem>
                {BLOOD_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={eligibility} onValueChange={(v) => setEligibility(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Donors</SelectItem>
                <SelectItem value="eligible">Eligible</SelectItem>
                <SelectItem value="ineligible">Not Eligible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-sm">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>{viewing.id}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <PersonAvatar name={viewing.name} seed={viewing.avatarSeed} size="lg" />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{viewing.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {viewing.gender} &middot; {viewing.bloodType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneIcon className="size-4 text-muted-foreground" />
                  <span>{viewing.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span>{viewing.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <DropletIcon className="size-4 text-muted-foreground" />
                  <span>{viewing.totalDonations} total donations</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-muted-foreground">Last Donation</span>
                  <span className="font-medium text-foreground">
                    {viewing.lastDonationDate ? format(new Date(viewing.lastDonationDate), "dd MMM yyyy") : "None yet"}
                  </span>
                </div>
                {viewing.eligible ? (
                  <StatusBadge status="Eligible" tone="green" className="w-fit" />
                ) : (
                  <StatusBadge status="Not Eligible" tone="red" className="w-fit" />
                )}
              </div>
              <DialogFooter showCloseButton>
                {viewing.eligible && (
                  <Button
                    onClick={() => {
                      handleScheduleDonation(viewing)
                      setViewing(null)
                    }}
                  >
                    Schedule Donation
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Register Donor</DialogTitle>
            <DialogDescription>Add a new donor to the directory.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donor-name">Full Name</Label>
              <Input
                id="donor-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="donor-bloodtype">Blood Group</Label>
                <Select value={formBloodType} onValueChange={(v) => setFormBloodType((v as BloodGroup) ?? BLOOD_GROUPS[0])}>
                  <SelectTrigger id="donor-bloodtype" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="donor-gender">Gender</Label>
                <Select value={formGender} onValueChange={(v) => setFormGender((v as "Male" | "Female") ?? "Female")}>
                  <SelectTrigger id="donor-gender" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donor-phone">Phone</Label>
              <Input
                id="donor-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhoneInput(e.target.value) }))}
                {...phoneInputProps}
                placeholder="+234..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donor-email">Email</Label>
              <Input
                id="donor-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegisterDonor}>Register Donor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { DonorsList }
