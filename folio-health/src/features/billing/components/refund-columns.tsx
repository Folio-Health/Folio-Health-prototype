"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, CheckCircle2Icon, XCircleIcon, EyeIcon } from "lucide-react"
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
import { getPatientById } from "@/lib/mock/patients"
import { formatNaira, type Refund } from "@/lib/mock/billing"

function getRefundColumns({
  onView,
  onProcess,
  onReject,
}: {
  onView: (refund: Refund) => void
  onProcess: (refund: Refund) => void
  onReject: (refund: Refund) => void
}): ColumnDef<Refund>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Refund ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      accessorKey: "invoiceId",
      header: "Invoice ID",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.invoiceId}</span>,
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
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.amount)}</span>,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.reason}</span>,
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
        const refund = row.original
        const isPending = refund.status === "Pending"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(refund)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <RoleGate permission="BILLING_REFUND">
                <DropdownMenuItem disabled={!isPending} onClick={() => onProcess(refund)}>
                  <CheckCircle2Icon />
                  Process Refund
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!isPending} variant="destructive" onClick={() => onReject(refund)}>
                  <XCircleIcon />
                  Reject
                </DropdownMenuItem>
              </RoleGate>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getRefundColumns }
