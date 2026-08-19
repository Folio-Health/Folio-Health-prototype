"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, CheckCircle2Icon, UserPlusIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { priorityTone, type SupportTicket } from "@/lib/mock/communication"

function getTicketColumns({
  onResolve,
  onAssignToMe,
}: {
  onResolve: (ticket: SupportTicket) => void
  onAssignToMe: (ticket: SupportTicket) => void
}): ColumnDef<SupportTicket>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      accessorKey: "subject",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.subject}</span>
          <span className="text-xs text-muted-foreground">{row.original.category}</span>
        </div>
      ),
    },
    {
      id: "requester",
      header: "Requester",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={row.original.requesterName} size="sm" />
          <span className="text-sm text-foreground">{row.original.requesterName}</span>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => <StatusBadge status={row.original.priority} tone={priorityTone(row.original.priority)} />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) =>
        row.original.assignedToName ? (
          <span className="text-sm text-foreground">{row.original.assignedToName}</span>
        ) : (
          <Badge variant="outline">Unassigned</Badge>
        ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const ticket = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAssignToMe(ticket)}>
                <UserPlusIcon />
                Assign to me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResolve(ticket)}>
                <CheckCircle2Icon />
                Mark Resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getTicketColumns }
