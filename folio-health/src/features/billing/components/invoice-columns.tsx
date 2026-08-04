"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, WalletIcon, PrinterIcon } from "lucide-react"
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
import { formatNaira, type Invoice } from "@/lib/mock/billing"

function getInvoiceColumns({
  onView,
  onRecordPayment,
  onPrint,
}: {
  onView: (invoice: Invoice) => void
  onRecordPayment: (invoice: Invoice) => void
  onPrint: (invoice: Invoice) => void
}): ColumnDef<Invoice>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice ID" />,
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
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground">{patient.mrn}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy")}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.amount)}</span>,
    },
    {
      accessorKey: "paid",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Paid" />,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatNaira(row.original.paid)}</span>,
    },
    {
      accessorKey: "balance",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
      cell: ({ row }) => (
        <span className={row.original.balance > 0 ? "font-medium tabular-nums text-foreground" : "tabular-nums text-muted-foreground"}>
          {formatNaira(row.original.balance)}
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
        const invoice = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(invoice)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem disabled={invoice.balance <= 0} onClick={() => onRecordPayment(invoice)}>
                <WalletIcon />
                Record Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint(invoice)}>
                <PrinterIcon />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getInvoiceColumns }
