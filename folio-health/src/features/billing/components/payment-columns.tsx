"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { formatNaira, type Payment } from "@/lib/mock/billing"

const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment ID" />,
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
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => <StatusBadge status={row.original.method} tone="blue" />,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy, h:mm a")}</span>
    ),
  },
  {
    id: "recordedBy",
    header: "Recorded By",
    cell: ({ row }) => {
      const staff = getStaffById(row.original.recordedByStaffId)
      return <span className="text-muted-foreground">{staff?.name ?? "N/A"}</span>
    },
  },
]

export { paymentColumns }
