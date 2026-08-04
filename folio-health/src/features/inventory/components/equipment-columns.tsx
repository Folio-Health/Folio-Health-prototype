"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import type { Equipment } from "@/lib/mock/inventory"

const STATUS_TONE = {
  Operational: "green",
  "Under Maintenance": "amber",
  "Out of Service": "red",
} as const

const equipmentColumns: ColumnDef<Equipment>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipment Name" />,
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.category}</span>,
  },
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.serialNumber}</span>,
  },
  {
    accessorKey: "department",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location / Department" />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />,
  },
  {
    accessorKey: "lastServicedDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Serviced" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(new Date(row.original.lastServicedDate), "MMM d, yyyy")}
      </span>
    ),
  },
]

export { equipmentColumns }
