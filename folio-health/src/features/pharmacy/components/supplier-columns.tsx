"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, EyeIcon, MailIcon, BanIcon, CheckCircle2Icon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Supplier } from "@/lib/mock/pharmacy"

function getSupplierColumns({
  onView,
  onToggleStatus,
}: {
  onView: (supplier: Supplier) => void
  onToggleStatus: (supplier: Supplier) => void
}): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier Name" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "contact",
      header: "Contact Person",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.contact}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "itemsSupplied",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Products Supplied" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.itemsSupplied}</span>,
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
        const supplier = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(supplier)}>
                <EyeIcon />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href={`mailto:${supplier.email}`} />}>
                <MailIcon />
                Email Supplier
              </DropdownMenuItem>
              <DropdownMenuItem
                variant={supplier.status === "Active" ? "destructive" : undefined}
                onClick={() => onToggleStatus(supplier)}
              >
                {supplier.status === "Active" ? <BanIcon /> : <CheckCircle2Icon />}
                {supplier.status === "Active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getSupplierColumns }
