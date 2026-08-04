"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, BookmarkPlusIcon, CheckIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge, type StatusTone } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getDonorById, type BloodUnit, type UnitStatus } from "@/lib/mock/blood-bank"

const UNIT_STATUS_TONE: Record<UnitStatus, StatusTone> = {
  Available: "green",
  Reserved: "violet",
  "Expiring Soon": "amber",
  Expired: "red",
  Used: "slate",
}

function getBloodUnitColumns({
  onView,
  onReserve,
  onMarkUsed,
}: {
  onView: (unit: BloodUnit) => void
  onReserve: (unit: BloodUnit) => void
  onMarkUsed: (unit: BloodUnit) => void
}): ColumnDef<BloodUnit>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Unit ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      accessorKey: "bloodType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Blood Group" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.bloodType}</span>
          <span className="text-xs text-muted-foreground">{row.original.component}</span>
        </div>
      ),
    },
    {
      id: "donor",
      header: "Donor",
      cell: ({ row }) => {
        const donor = getDonorById(row.original.donorId)
        if (!donor) return <span className="text-muted-foreground">Unknown donor</span>
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={donor.name} seed={donor.avatarSeed} size="sm" />
            <span className="text-foreground">{donor.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "collectedDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Collection Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.collectedDate), "MMM d, yyyy")}</span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.expiryDate), "MMM d, yyyy")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} tone={UNIT_STATUS_TONE[row.original.status]} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const unit = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(unit)}>
                <EyeIcon />
                View Unit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={unit.status !== "Available"} onClick={() => onReserve(unit)}>
                <BookmarkPlusIcon />
                Reserve
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={unit.status !== "Available" && unit.status !== "Reserved"}
                onClick={() => onMarkUsed(unit)}
              >
                <CheckIcon />
                Mark Used
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getBloodUnitColumns }
