"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { UsersIcon, UserCheckIcon, UserMinusIcon, ShieldCheckIcon, SearchIcon, PlusIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
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
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { getUsersColumns } from "./users-columns"
import { STAFF } from "@/lib/mock/staff"
import { CLINICAL_ROLES, DEPARTMENTS } from "@/types/core"
import type { StaffMember, ClinicalRole, Department } from "@/types/core"

const ALL = "all"

function UsersList() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [overrides, setOverrides] = useState<Record<string, Partial<StaffMember>>>({})
  const [deactivating, setDeactivating] = useState<StaffMember | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "", department: "" })
  const [localUsers, setLocalUsers] = useState<StaffMember[]>([])
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDepartment, setEditDepartment] = useState<Department>(DEPARTMENTS[0])
  const [editShift, setEditShift] = useState<StaffMember["shift"]>("Morning")
  const [editStatus, setEditStatus] = useState<StaffMember["status"]>("Active")

  const allUsers = useMemo(() => [...localUsers, ...STAFF], [localUsers])

  const rows = useMemo(
    () => allUsers.map((s) => ({ ...s, ...overrides[s.id] })),
    [allUsers, overrides]
  )

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      if (search) {
        const q = search.toLowerCase()
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      }
      if (role !== ALL && u.role !== role) return false
      if (status !== ALL && u.status !== status) return false
      return true
    })
  }, [rows, search, role, status])

  const activeCount = rows.filter((u) => u.status === "Active").length
  const inactiveCount = rows.filter((u) => u.status === "Inactive").length
  const adminCount = rows.filter((u) => u.role === "Administrator" || u.role === "Hospital Management").length

  function handleDeactivate(user: StaffMember) {
    setOverrides((prev) => ({ ...prev, [user.id]: { ...prev[user.id], status: "Inactive" } }))
    toast.success(`${user.name} deactivated`, { description: "Their system access has been revoked." })
  }

  function handleAddUser() {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.role || !newUser.department) {
      toast.error("Name, email, role, and department are required")
      return
    }
    const user: StaffMember = {
      id: `USR-local-${Date.now()}`,
      staffId: `EMP-${Date.now().toString().slice(-5)}`,
      name: newUser.name.trim(),
      role: newUser.role as ClinicalRole,
      department: newUser.department as Department,
      title: newUser.role,
      email: newUser.email.trim(),
      phone: "+234 800 000 0000",
      avatarSeed: newUser.name.trim(),
      status: "Active",
      shift: "Morning",
      joinedAt: new Date().toISOString(),
    }
    setLocalUsers((prev) => [user, ...prev])
    toast.success("User created", {
      description: `${user.name} has been added as a system user.`,
    })
    setAddOpen(false)
    setNewUser({ name: "", email: "", role: "", department: "" })
  }

  function handleEditOpen(user: StaffMember) {
    setEditing(user)
    setEditTitle(user.title)
    setEditDepartment(user.department)
    setEditShift(user.shift)
    setEditStatus(user.status)
  }

  function handleSaveEdit() {
    if (!editing) return
    if (!editTitle.trim()) {
      toast.error("Enter a title for this user")
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
    toast.success(`${editing.name} updated`, { description: "User profile changes have been saved." })
    setEditing(null)
  }

  const columns = getUsersColumns({
    onEdit: handleEditOpen,
    onResetPassword: (user) =>
      toast.success(`Password reset email sent`, { description: `An email has been sent to ${user.email}.` }),
    onDeactivate: setDeactivating,
  })

  return (
    <div>
      <PageHeader
        title="System Users"
        description={`${allUsers.length} user accounts with system access`}
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Users" }]}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon />
            Add User
          </Button>
        }
      />

      <AdministrationModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={allUsers.length} icon={UsersIcon} />
        <StatCard label="Active" value={activeCount} icon={UserCheckIcon} tone="emerald" />
        <StatCard label="Inactive" value={inactiveCount} icon={UserMinusIcon} tone="red" />
        <StatCard label="Admin Accounts" value={adminCount} icon={ShieldCheckIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name or email..."
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new system user account.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-user-name">Full Name</Label>
              <Input
                id="new-user-name"
                placeholder="e.g. Dr. Amaka Obi"
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-user-email">Email Address</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="name@foliohealth.example"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser((prev) => ({ ...prev, role: v ?? "" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLINICAL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Department</Label>
                <Select
                  value={newUser.department}
                  onValueChange={(v) => setNewUser((prev) => ({ ...prev, department: v ?? "" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate ${deactivating?.name ?? "this user"}?`}
        description="This will revoke their system access immediately. This can be reversed later."
        confirmLabel="Deactivate"
        onConfirm={() => deactivating && handleDeactivate(deactivating)}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit {editing.name}</DialogTitle>
                <DialogDescription>Update this user&apos;s account details.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-user-title">Title</Label>
                  <Input
                    id="edit-user-title"
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

export { UsersList }
