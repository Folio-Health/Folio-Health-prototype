"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, CheckCircle2Icon, TruckIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSupplierById, formatNaira, type PurchaseOrder } from "@/lib/mock/pharmacy"

function getPurchaseOrderColumns({
  onView,
  onAdvance,
}: {
  onView: (po: PurchaseOrder) => void
  onAdvance: (po: PurchaseOrder) => void
}): ColumnDef<PurchaseOrder>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="PO Number" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const supplier = getSupplierById(row.original.supplierId)
        return <span className="text-foreground">{supplier?.name ?? "Unknown"}</span>
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => <span className="tabular-nums">{row.original.items.length}</span>,
    },
    {
      id: "totalAmount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Amount" />,
      cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.totalAmount)}</span>,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy")}</span>
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
        const po = row.original
        const nextLabel =
          po.status === "Draft" ? "Send to Supplier" : po.status === "Pending" ? "Approve" : po.status === "Approved" ? "Mark Delivered" : null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(po)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              {nextLabel && (
                <DropdownMenuItem onClick={() => onAdvance(po)}>
                  {po.status === "Approved" ? <TruckIcon /> : <CheckCircle2Icon />}
                  {nextLabel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getPurchaseOrderColumns }
