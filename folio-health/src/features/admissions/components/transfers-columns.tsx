"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, CheckIcon, CheckCheckIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPatientById } from "@/lib/mock/patients"
import { getWardById, getBedById } from "@/lib/mock/admissions"
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
        const patient = getPatientById(row.original.patientId)
        if (!patient) return <span className="text-muted-foreground">Unknown patient</span>
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground">{patient.mrn}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "from",
      header: "From",
      cell: ({ row }) => {
        const ward = getWardById(row.original.fromWardId)
        const bed = getBedById(row.original.fromBedId)
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
        const ward = getWardById(row.original.toWardId)
        const bed = getBedById(row.original.toBedId)
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
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={transfer.status !== "Pending"}
                onClick={() => onApprove(transfer)}
              >
                <CheckIcon />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={transfer.status !== "Approved"}
                onClick={() => onComplete(transfer)}
              >
                <CheckCheckIcon />
                Mark Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { transfersColumns }
