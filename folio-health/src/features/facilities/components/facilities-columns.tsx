"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import type { FacilitySummary } from "@/lib/fhir/organization"

export const facilitiesColumns: ColumnDef<FacilitySummary>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Facility" />,
    cell: ({ row }) => {
      const facility = row.original
      return (
        <Link
          href={`/facilities/${facility.id}`}
          className="flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-medium text-foreground hover:text-primary hover:underline">
            {facility.name}
          </span>
          {facility.identifier && (
            <span className="font-mono text-xs text-muted-foreground">{facility.identifier}</span>
          )}
        </Link>
      )
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.type}</span>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.address || "—"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.phone || row.original.email || "—"}
      </span>
    ),
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.active ? "Active" : "Inactive"} />,
  },
]
