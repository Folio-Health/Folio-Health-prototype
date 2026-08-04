"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, SendIcon } from "lucide-react"
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
import { formatNaira, type Claim } from "@/lib/mock/billing"

function getClaimColumns({
  onView,
  onFollowUp,
}: {
  onView: (claim: Claim) => void
  onFollowUp: (claim: Claim) => void
}): ColumnDef<Claim>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Claim ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const patient = getPatientById(row.original.patientId)
        if (!patient) return <span className="text-muted-foreground">Unknown</span>
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
            <span className="font-medium text-foreground">{patient.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "insurer",
      header: "Insurer",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.insurer}</span>,
    },
    {
      accessorKey: "amountClaimed",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount Claimed" />,
      cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.amountClaimed)}</span>,
    },
    {
      accessorKey: "amountApproved",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount Approved" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.amountApproved > 0 ? formatNaira(row.original.amountApproved) : "N/A"}
        </span>
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
        <span className="text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const claim = row.original
        const canFollowUp = claim.status === "Submitted" || claim.status === "Under Review"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(claim)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canFollowUp} onClick={() => onFollowUp(claim)}>
                <SendIcon />
                Follow Up with Insurer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getClaimColumns }
