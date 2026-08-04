"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { getStaffById } from "@/lib/mock/staff"
import type { AuditLogEntry } from "@/lib/mock/administration"

export const auditLogsColumns: ColumnDef<AuditLogEntry>[] = [
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
    accessorKey: "action",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
    cell: ({ row }) => <StatusBadge status={row.original.action} tone="blue" />,
  },
  {
    accessorKey: "entity",
    header: "Entity",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.entity}</span>,
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.ipAddress}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} tone={row.original.status === "Success" ? "green" : "red"} />
    ),
  },
]
