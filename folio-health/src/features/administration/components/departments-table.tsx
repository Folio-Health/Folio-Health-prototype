"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Building2Icon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { getDepartmentTableColumns } from "./departments-columns"
import { getDepartmentSummaries, type DepartmentSummary } from "@/lib/mock/hr"
import { STAFF } from "@/lib/mock/staff"
import type { Department } from "@/types/core"

function DepartmentsTable() {
  const [search, setSearch] = useState("")
  const baseDepartments = useMemo(() => getDepartmentSummaries(), [])
  const [overrides, setOverrides] = useState<Record<Department, Partial<DepartmentSummary>>>(
    {} as Record<Department, Partial<DepartmentSummary>>
  )
  const [editing, setEditing] = useState<DepartmentSummary | null>(null)
  const [editHead, setEditHead] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const departments = useMemo(
    () => baseDepartments.map((d) => ({ ...d, ...overrides[d.department] })),
    [baseDepartments, overrides]
  )

  const filtered = useMemo(() => {
    if (!search) return departments
    const q = search.toLowerCase()
    return departments.filter(
      (d) => d.department.toLowerCase().includes(q) || d.head.toLowerCase().includes(q)
    )
  }, [departments, search])

  const totalStaff = departments.reduce((sum, d) => sum + d.staffCount, 0)

  function handleEditOpen(dept: DepartmentSummary) {
    setEditing(dept)
    setEditHead(dept.head)
    setEditDescription(dept.description)
  }

  function handleSaveEdit() {
    if (!editing) return
    if (!editHead.trim()) {
      toast.error("Select a head of department")
      return
    }
    setOverrides((prev) => ({
      ...prev,
      [editing.department]: {
        ...prev[editing.department],
        head: editHead,
        description: editDescription.trim() || editing.description,
      },
    }))
    toast.success(`${editing.department} updated`, {
      description: "Department details have been saved.",
    })
    setEditing(null)
  }

  const headCandidates = editing
    ? (() => {
        const inDept = STAFF.filter((s) => s.department === editing.department)
        return inDept.length > 0 ? inDept : STAFF
      })()
    : []

  const columns = getDepartmentTableColumns({
    onEdit: handleEditOpen,
  })

  return (
    <div>
      <PageHeader
        title="Department Management"
        description={`${departments.length} departments, ${totalStaff} staff members total`}
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Departments" }]}
      />

      <AdministrationModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-2">
        <StatCard label="Total Departments" value={departments.length} icon={Building2Icon} />
        <StatCard label="Total Staff" value={totalStaff} icon={Building2Icon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No departments found"
        emptyDescription="Try adjusting your search."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by department or head..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit {editing.department}</DialogTitle>
                <DialogDescription>Update the department&apos;s head and description.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Head of Department</Label>
                  <Select value={editHead} onValueChange={(v) => setEditHead(v ?? editHead)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select head of department" />
                    </SelectTrigger>
                    <SelectContent>
                      {headCandidates.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-dept-description">Description</Label>
                  <Textarea
                    id="edit-dept-description"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
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

export { DepartmentsTable }
