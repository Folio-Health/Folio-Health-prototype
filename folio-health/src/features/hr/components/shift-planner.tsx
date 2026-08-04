"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { SearchIcon, CalendarRangeIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HrModuleTabs } from "./hr-module-tabs"
import { WEEK_DAYS, WEEKLY_SHIFTS, type ShiftValue } from "@/lib/mock/hr"
import { STAFF } from "@/lib/mock/staff"
import { CLINICAL_ROLES, DEPARTMENTS } from "@/types/core"
import type { StaffMember } from "@/types/core"

const ALL = "all"

const SHIFT_TONE: Record<ShiftValue, "blue" | "violet" | "slate" | "cyan"> = {
  Morning: "blue",
  Evening: "violet",
  Night: "cyan",
  Off: "slate",
}

function ShiftPill({ value }: { value: ShiftValue }) {
  return <StatusBadge status={value} tone={SHIFT_TONE[value]} />
}

const columns: ColumnDef<StaffMember>[] = [
  {
    accessorKey: "name",
    header: "Staff",
    cell: ({ row }) => {
      const staff = row.original
      return (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={staff.name} seed={staff.avatarSeed} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{staff.name}</span>
            <span className="text-xs text-muted-foreground">
              {staff.role} &middot; {staff.department}
            </span>
          </div>
        </div>
      )
    },
  },
  ...WEEK_DAYS.map(
    (day): ColumnDef<StaffMember> => ({
      id: day,
      header: day,
      cell: ({ row }) => <ShiftPill value={WEEKLY_SHIFTS[row.original.id]?.[day] ?? "Off"} />,
    })
  ),
]

function ShiftPlanner() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState(ALL)
  const [department, setDepartment] = useState(ALL)

  const filtered = useMemo(() => {
    return STAFF.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.staffId.toLowerCase().includes(q)) return false
      }
      if (role !== ALL && s.role !== role) return false
      if (department !== ALL && s.department !== department) return false
      return true
    })
  }, [search, role, department])

  return (
    <div>
      <PageHeader
        title="Shift Planner"
        description="Weekly shift assignments across the staff roster"
        breadcrumbs={[{ label: "Facility" }, { label: "HR", href: "/hr" }, { label: "Shift Planner" }]}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarRangeIcon className="size-4" />
            Current week
          </div>
        }
      />

      <HrModuleTabs />

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No staff found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name or staff ID..."
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
          </div>
        }
      />
    </div>
  )
}

export { ShiftPlanner }
