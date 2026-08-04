"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { StarIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatNaira } from "@/lib/mock/billing"
import type { DepartmentPerformanceRow } from "@/lib/mock/analytics"

const departmentPerformanceColumns: ColumnDef<DepartmentPerformanceRow>[] = [
  {
    accessorKey: "department",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.department}</span>,
  },
  {
    accessorKey: "patientsSeen",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patients Seen" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.patientsSeen}</span>,
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Revenue" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.revenue)}</span>,
  },
  {
    accessorKey: "avgWaitTimeMinutes",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avg Wait Time" />,
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.avgWaitTimeMinutes} min</span>,
  },
  {
    accessorKey: "satisfactionScore",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Satisfaction" />,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 font-medium tabular-nums text-foreground">
        <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
        {row.original.satisfactionScore.toFixed(1)}
      </span>
    ),
  },
]

export { departmentPerformanceColumns }
