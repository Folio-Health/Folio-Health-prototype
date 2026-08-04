"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, PackagePlusIcon, EyeIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSupplyStatus, formatNaira, type SupplyItem } from "@/lib/mock/inventory"

function getSuppliesColumns({
  onView,
  onReorder,
}: {
  onView: (item: SupplyItem) => void
  onReorder: (item: SupplyItem) => void
}): ColumnDef<SupplyItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Item Name" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.category}</span>,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.quantity.toLocaleString()}</span>,
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => <span className="text-muted-foreground capitalize">{row.original.unit}</span>,
    },
    {
      accessorKey: "reorderLevel",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reorder Level" />,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.reorderLevel}</span>,
    },
    {
      id: "unitCost",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Unit Cost" />,
      cell: ({ row }) => <span className="tabular-nums">{formatNaira(row.original.unitCost)}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={getSupplyStatus(row.original)} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        const status = getSupplyStatus(item)
        const canReorder = status === "Low Stock" || status === "Out of Stock"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(item)}>
                <EyeIcon />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canReorder} onClick={() => onReorder(item)}>
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

export { getSuppliesColumns }
