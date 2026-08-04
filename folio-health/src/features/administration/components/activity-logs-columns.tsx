"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { getStaffById } from "@/lib/mock/staff"
import type { ActivityLogEntry } from "@/lib/mock/administration"

export const activityLogsColumns: ColumnDef<ActivityLogEntry>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {format(new Date(row.original.timestamp), "MMM d, yyyy h:mm a")}
      </span>
    ),
  },
  {
    id: "user",
    header: "User",
    cell: ({ row }) => {
      const staff = getStaffById(row.original.staffId)
      if (!staff) return <span className="text-muted-foreground">Unknown</span>
      return (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={staff.name} seed={staff.avatarSeed} size="sm" />
          <span className="font-medium text-foreground">{staff.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "activity",
    header: "Activity",
    cell: ({ row }) => <span className="text-foreground">{row.original.activity}</span>,
  },
  {
    accessorKey: "module",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
    cell: ({ row }) => <StatusBadge status={row.original.module} tone="slate" />,
  },
]
