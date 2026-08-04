"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckIcon, XIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getStaffById } from "@/lib/mock/staff"
import type { LeaveRequest } from "@/lib/mock/hr"

function getLeaveColumns({
  onApprove,
  onReject,
}: {
  onApprove: (leave: LeaveRequest) => void
  onReject: (leave: LeaveRequest) => void
}): ColumnDef<LeaveRequest>[] {
  return [
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
      accessorKey: "leaveType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leave Type" />,
      cell: ({ row }) => <StatusBadge status={row.original.leaveType} tone="blue" />,
    },
    {
      accessorKey: "from",
      header: ({ column }) => <DataTableColumnHeader column={column} title="From" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{format(new Date(row.original.from), "MMM d, yyyy")}</span>
      ),
    },
    {
      accessorKey: "to",
      header: "To",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{format(new Date(row.original.to), "MMM d, yyyy")}</span>
      ),
    },
    {
      accessorKey: "days",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Days" />,
      cell: ({ row }) => <span className="tabular-nums text-foreground">{row.original.days}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const leave = row.original
        if (leave.status !== "Pending") return null
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="icon-sm" onClick={() => onApprove(leave)} aria-label="Approve">
              <CheckIcon className="size-4 text-emerald-600" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => onReject(leave)} aria-label="Reject">
              <XIcon className="size-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]
}

export { getLeaveColumns }
