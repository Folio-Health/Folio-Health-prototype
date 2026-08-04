"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { getStaffById } from "@/lib/mock/staff"
import type { AttendanceRecord } from "@/lib/mock/hr"

const STATUS_TONE = {
  Present: "green",
  Absent: "red",
  Late: "amber",
} as const

export const attendanceColumns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">{format(new Date(row.original.date), "MMM d, yyyy")}</span>
    ),
  },
  {
    id: "staff",
    header: "Staff",
    cell: ({ row }) => {
      const staff = getStaffById(row.original.staffId)
      if (!staff) return <span className="text-muted-foreground">Unknown</span>
      return (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={staff.name} seed={staff.avatarSeed} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{staff.name}</span>
            <span className="text-xs text-muted-foreground">{staff.department}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "clockIn",
    header: "Clock In",
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.clockIn ?? "N/A"}</span>,
  },
  {
    accessorKey: "clockOut",
    header: "Clock Out",
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.clockOut ?? "N/A"}</span>,
  },
  {
    accessorKey: "hoursWorked",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hours Worked" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {row.original.hoursWorked > 0 ? `${row.original.hoursWorked.toFixed(1)}h` : "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />,
  },
]
