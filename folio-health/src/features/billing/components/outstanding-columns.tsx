"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, BellIcon, WalletIcon } from "lucide-react"
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
import { formatNaira, type OutstandingBill } from "@/lib/mock/billing"

function getOutstandingColumns({
  onSendReminder,
  onRecordPayment,
}: {
  onSendReminder: (bill: OutstandingBill) => void
  onRecordPayment: (bill: OutstandingBill) => void
}): ColumnDef<OutstandingBill>[] {
  return [
    {
      accessorKey: "invoiceId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.invoiceId}</span>,
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
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground">{patient.mrn}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "amountDue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount Due" />,
      cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.amountDue)}</span>,
    },
    {
      accessorKey: "daysOverdue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Days Overdue" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.daysOverdue > 0 ? `${row.original.daysOverdue} days` : "Not yet due"}
        </span>
      ),
    },
    {
      accessorKey: "lastReminderSent",
      header: "Last Reminder Sent",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.lastReminderSent ? format(new Date(row.original.lastReminderSent), "dd MMM yyyy") : "Never"}
        </span>
      ),
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
        const bill = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <RoleGate roles={["billing-cashier", "facility-admin"]}>
                <DropdownMenuItem onClick={() => onSendReminder(bill)}>
                  <BellIcon />
                  Send Reminder
                </DropdownMenuItem>
              </RoleGate>
              <RoleGate permission="BILLING_RECEIVE_PAYMENT">
                <DropdownMenuItem onClick={() => onRecordPayment(bill)}>
                  <WalletIcon />
                  Record Payment
                </DropdownMenuItem>
              </RoleGate>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getOutstandingColumns }
