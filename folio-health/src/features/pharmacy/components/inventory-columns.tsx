"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, PackagePlusIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInventoryStatus, formatNaira, type Drug } from "@/lib/mock/pharmacy"

function getInventoryColumns({
  onView,
  onReorder,
}: {
  onView: (drug: Drug) => void
  onReorder: (drug: Drug) => void
}): ColumnDef<Drug>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Drug Name" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.category}</span>,
    },
    {
      accessorKey: "batchNo",
      header: "Batch No",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.batchNo}</span>,
    },
    {
      accessorKey: "stockQty",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock Qty" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.stockQty.toLocaleString()}</span>,
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => <span className="text-muted-foreground capitalize">{row.original.unit}</span>,
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.expiryDate), "dd MMM yyyy")}</span>
      ),
    },
    {
      id: "price",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Unit Price" />,
      cell: ({ row }) => <span className="tabular-nums">{formatNaira(row.original.price)}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={getInventoryStatus(row.original)} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const drug = row.original
        const status = getInventoryStatus(drug)
        const canReorder = status === "Low Stock" || status === "Out of Stock"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(drug)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canReorder} onClick={() => onReorder(drug)}>
                <PackagePlusIcon />
                Reorder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getInventoryColumns }
