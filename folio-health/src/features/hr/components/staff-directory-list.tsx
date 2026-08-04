"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { UsersIcon, UserCheckIcon, UserMinusIcon, Building2Icon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { HrModuleTabs } from "./hr-module-tabs"
import { getStaffColumns } from "./staff-columns"
import { STAFF } from "@/lib/mock/staff"
import { CLINICAL_ROLES, DEPARTMENTS } from "@/types/core"
import type { StaffMember, Department } from "@/types/core"
import { format } from "date-fns"

const ALL = "all"

function StaffDirectoryList() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState(ALL)
  const [department, setDepartment] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [overrides, setOverrides] = useState<Record<string, Partial<StaffMember>>>({})
  const [viewing, setViewing] = useState<StaffMember | null>(null)
  const [deactivating, setDeactivating] = useState<StaffMember | null>(null)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDepartment, setEditDepartment] = useState<Department>(DEPARTMENTS[0])
  const [editShift, setEditShift] = useState<StaffMember["shift"]>("Morning")
  const [editStatus, setEditStatus] = useState<StaffMember["status"]>("Active")

  const rows = useMemo(
    () => STAFF.map((s) => ({ ...s, ...overrides[s.id] })),
    [overrides]
  )

  const filtered = useMemo(() => {
    return rows.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.staffId.toLowerCase().includes(q) &&
          !s.email.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (role !== ALL && s.role !== role) return false
      if (department !== ALL && s.department !== department) return false
      if (status !== ALL && s.status !== status) return false
      return true
    })
  }, [rows, search, role, department, status])

  const activeCount = rows.filter((s) => s.status === "Active").length
  const onLeaveCount = rows.filter((s) => s.status === "On Leave").length
  const departmentCount = new Set(rows.map((s) => s.department)).size

  function handleDeactivate(staff: StaffMember) {
    setOverrides((prev) => ({ ...prev, [staff.id]: { ...prev[staff.id], status: "Inactive" } }))
    toast.success(`${staff.name} deactivated`, {
      description: "Their access has been revoked and status set to Inactive.",
    })
  }

  function handleEditOpen(staff: StaffMember) {
    setEditing(staff)
    setEditTitle(staff.title)
    setEditDepartment(staff.department)
    setEditShift(staff.shift)
    setEditStatus(staff.status)
  }

  function handleSaveEdit() {
    if (!editing) return
    if (!editTitle.trim()) {
      toast.error("Enter a title for this staff member")
      return
    }
    setOverrides((prev) => ({
      ...prev,
      [editing.id]: {
        ...prev[editing.id],
        title: editTitle.trim(),
        department: editDepartment,
        shift: editShift,
        status: editStatus,
      },
    }))
    toast.success(`${editing.name} updated`, {
      description: "Staff profile changes have been saved.",
    })
    setEditing(null)
  }

  const columns = getStaffColumns({
    onView: setViewing,
    onEdit: handleEditOpen,
    onDeactivate: setDeactivating,
  })

  return (
    <div>
      <PageHeader
        title="Staff Directory"
        description={`${STAFF.length} staff members across ${DEPARTMENTS.length} departments`}
        breadcrumbs={[{ label: "Facility" }, { label: "HR" }]}
      />

      <HrModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Staff" value={STAFF.length} icon={UsersIcon} />
        <StatCard label="Active" value={activeCount} icon={UserCheckIcon} tone="emerald" />
        <StatCard label="On Leave" value={onLeaveCount} icon={UserMinusIcon} tone="amber" />
        <StatCard label="Departments" value={departmentCount} icon={Building2Icon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(staff) => setViewing(staff)}
        emptyTitle="No staff found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={role} onValueChange={(v) => setRole(v ?? ALL)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Roles</SelectItem>
                {CLINICAL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={(v) => setDepartment(v ?? ALL)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>
                  {viewing.title} &middot; {viewing.staffId}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3">
                <PersonAvatar name={viewing.name} seed={viewing.avatarSeed} size="lg" />
                <div className="flex flex-col gap-1">
                  <StatusBadge status={viewing.status} className="w-fit" />
                  <span className="text-xs text-muted-foreground">
                    Joined {format(new Date(viewing.joinedAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Role" value={viewing.role} />
                <Field label="Department" value={viewing.department} />
                <Field label="Shift" value={viewing.shift} />
                <Field label="License No." value={viewing.licenseNo ?? "N/A"} />
                <Field label="Email" value={viewing.email} />
                <Field label="Phone" value={viewing.phone} />
              </div>
              <DialogFooter showCloseButton />
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate ${deactivating?.name ?? "staff member"}?`}
        description="This will revoke their system access and mark them as inactive. This can be reversed later."
        confirmLabel="Deactivate"
        onConfirm={() => deactivating && handleDeactivate(deactivating)}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit {editing.name}</DialogTitle>
                <DialogDescription>Update this staff member&apos;s role details.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-staff-title">Title</Label>
                  <Input
                    id="edit-staff-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Department</Label>
                    <Select
                      value={editDepartment}
                      onValueChange={(v) => setEditDepartment((v as Department) ?? editDepartment)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Shift</Label>
                    <Select
                      value={editShift}
                      onValueChange={(v) => setEditShift((v as StaffMember["shift"]) ?? editShift)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus((v as StaffMember["status"]) ?? editStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

export { StaffDirectoryList }
