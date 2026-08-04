"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  DropletIcon,
  SearchIcon,
  PackageCheckIcon,
  BookmarkIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
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
import { BLOOD_UNITS, BLOOD_GROUPS, getDonorById, type BloodUnit, type UnitStatus } from "@/lib/mock/blood-bank"
import { getBloodUnitColumns } from "./blood-unit-columns"

const ALL = "all"

function BloodBankInventory() {
  const [search, setSearch] = useState("")
  const [bloodType, setBloodType] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [overrides, setOverrides] = useState<Record<string, UnitStatus>>({})
  const [viewing, setViewing] = useState<BloodUnit | null>(null)

  const rows = useMemo(
    () => BLOOD_UNITS.map((u) => (overrides[u.id] ? { ...u, status: overrides[u.id] } : u)),
    [overrides]
  )

  const stats = useMemo(() => {
    const total = rows.length
    const available = rows.filter((u) => u.status === "Available").length
    const reserved = rows.filter((u) => u.status === "Reserved").length
    const expiringSoon = rows.filter((u) => u.status === "Expiring Soon").length
    return { total, available, reserved, expiringSoon }
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      if (bloodType !== ALL && u.bloodType !== bloodType) return false
      if (status !== ALL && u.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!u.id.toLowerCase().includes(q) && !u.component.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, search, bloodType, status])

  function handleReserve(unit: BloodUnit) {
    setOverrides((prev) => ({ ...prev, [unit.id]: "Reserved" }))
    toast.success(`${unit.id} reserved`, {
      description: `${unit.bloodType} ${unit.component} has been reserved for issue.`,
    })
  }

  function handleMarkUsed(unit: BloodUnit) {
    setOverrides((prev) => ({ ...prev, [unit.id]: "Used" }))
    toast.success(`${unit.id} marked as used`)
  }

  const columns = getBloodUnitColumns({ onView: setViewing, onReserve: handleReserve, onMarkUsed: handleMarkUsed })
  const viewingDonor = viewing ? getDonorById(viewing.donorId) : undefined

  return (
    <div>
      <PageHeader
        title="Blood Bank"
        description={`${rows.length} units in inventory`}
        breadcrumbs={[{ label: "Diagnostics" }, { label: "Blood Bank" }]}
        actions={
          <>
            <Button variant="outline" render={<Link href="/blood-bank/requests" />}>
              Requests
            </Button>
            <Button variant="outline" render={<Link href="/blood-bank/donors" />}>
              <UsersIcon />
              Donors
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Units" value={stats.total} icon={DropletIcon} />
        <StatCard label="Available" value={stats.available} icon={PackageCheckIcon} tone="emerald" />
        <StatCard label="Reserved" value={stats.reserved} icon={BookmarkIcon} tone="violet" />
        <StatCard label="Expiring Soon" value={stats.expiringSoon} icon={TriangleAlertIcon} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(unit) => setViewing(unit)}
        emptyTitle="No blood units found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by unit ID or component..."
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
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Used">Used</SelectItem>
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
                <DialogTitle>{viewing.id}</DialogTitle>
                <DialogDescription>
                  {viewing.bloodType} &middot; {viewing.component}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                {viewingDonor && (
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar name={viewingDonor.name} seed={viewingDonor.avatarSeed} size="sm" />
                    <span className="font-medium text-foreground">{viewingDonor.name}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Collected</span>
                    <span className="font-medium text-foreground">
                      {format(new Date(viewing.collectedDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Expires</span>
                    <span className="font-medium text-foreground">
                      {format(new Date(viewing.expiryDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Volume</span>
                    <span className="font-medium text-foreground">{viewing.volumeMl} mL</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <StatusBadge status={overrides[viewing.id] ?? viewing.status} className="w-fit" />
                  </div>
                </div>
              </div>
              <DialogFooter showCloseButton>
                {(overrides[viewing.id] ?? viewing.status) === "Available" && (
                  <Button
                    onClick={() => {
                      handleReserve(viewing)
                      setViewing(null)
                    }}
                  >
                    <BookmarkIcon />
                    Reserve
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { BloodBankInventory }
