"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, CheckIcon, XIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PurchaseRequest } from "@/lib/mock/inventory"
import { getStaffById } from "@/lib/mock/staff"

const STATUS_TONE = {
  Pending: "amber",
  Approved: "green",
  Rejected: "red",
  Fulfilled: "blue",
} as const

function getPurchaseRequestsColumns({
  onApprove,
  onReject,
}: {
  onApprove: (request: PurchaseRequest) => void
  onReject: (request: PurchaseRequest) => void
}): ColumnDef<PurchaseRequest>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Request ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      id: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => {
        const staff = getStaffById(row.original.requestedByStaffId)
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{staff?.name ?? "Unknown"}</span>
            <span className="text-xs text-muted-foreground">{row.original.department}</span>
          </div>
        )
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.items.map((i) => i.itemName).join(", ")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const request = row.original
        const canAct = request.status === "Pending"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canAct} onClick={() => onApprove(request)}>
                <CheckIcon />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canAct} onClick={() => onReject(request)}>
                <XIcon />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getPurchaseRequestsColumns }
