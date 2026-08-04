"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowRightIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import type { StockMovement } from "@/lib/mock/inventory"
import { getStaffById } from "@/lib/mock/staff"

const MOVEMENT_TONE = {
  In: "green",
  Out: "amber",
  Transfer: "blue",
  Adjustment: "violet",
} as const

const stockMovementColumns: ColumnDef<StockMovement>[] = [
  {
    accessorKey: "itemName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.itemName}</span>,
  },
  {
    accessorKey: "movementType",
    header: "Movement Type",
    cell: ({ row }) => (
      <StatusBadge status={row.original.movementType} tone={MOVEMENT_TONE[row.original.movementType]} />
    ),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.quantity.toLocaleString()}</span>,
  },
  {
    id: "route",
    header: "From / To",
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {row.original.fromLocation}
        <ArrowRightIcon className="size-3.5 shrink-0" />
        {row.original.toLocation}
      </span>
    ),
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
    id: "recordedBy",
    header: "Recorded By",
    cell: ({ row }) => {
      const staff = getStaffById(row.original.recordedByStaffId)
      return <span className="text-muted-foreground">{staff?.name ?? "Unknown"}</span>
    },
  },
]

export { stockMovementColumns }
