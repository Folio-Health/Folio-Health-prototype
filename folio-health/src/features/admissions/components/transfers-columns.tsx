"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, CheckIcon, CheckCheckIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { RoleGate } from "@/components/common/role-gate"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Transfer } from "@/lib/mock/admissions"

function transfersColumns(
  onApprove: (transfer: Transfer) => void,
  onComplete: (transfer: Transfer) => void
): ColumnDef<Transfer>[] {
  return [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const { patientId, patientName } = row.original as Transfer & { patientName?: string }
        const label = patientName ?? "Patient"
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={label} seed={patientId} size="sm" />
            <span className="font-medium text-foreground">{label}</span>
          </div>
        )
      },
    },
    {
      id: "from",
      header: "From",
      cell: ({ row }) => {
        const t = row.original as Transfer & { fromBedLabel?: string }
        const ward = t.fromWardId ? { name: t.fromWardId } : undefined
        const bed = t.fromBedLabel ? { label: t.fromBedLabel } : undefined
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{ward?.name ?? "N/A"}</span>
            <span className="text-xs text-muted-foreground">{bed?.label ?? "N/A"}</span>
          </div>
        )
      },
    },
    {
      id: "to",
      header: "To",
      cell: ({ row }) => {
        const t = row.original as Transfer & { toBedLabel?: string }
        const ward = t.toWardId ? { name: t.toWardId } : undefined
        const bed = t.toBedLabel ? { label: t.toBedLabel } : undefined
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{ward?.name ?? "N/A"}</span>
            <span className="text-xs text-muted-foreground">{bed?.label ?? "N/A"}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.requestedBy}</span>,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-52 text-muted-foreground">{row.original.reason}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.date), "MMM d, yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const transfer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <RoleGate roles={["doctor", "nurse"]}>
                <DropdownMenuItem
                  disabled={transfer.status !== "Pending"}
                  onClick={() => onApprove(transfer)}
                >
                  <CheckIcon />
                  Approve
                </DropdownMenuItem>
              </RoleGate>
              <RoleGate roles={["doctor", "nurse"]}>
                <DropdownMenuItem
                  disabled={transfer.status !== "Approved"}
                  onClick={() => onComplete(transfer)}
                >
                  <CheckCheckIcon />
                  Mark Completed
                </DropdownMenuItem>
              </RoleGate>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { transfersColumns }
