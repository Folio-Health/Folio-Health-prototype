"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, PhoneIcon, CalendarPlusIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Donor } from "@/lib/mock/blood-bank"

function getDonorColumns({
  onView,
  onScheduleDonation,
}: {
  onView: (donor: Donor) => void
  onScheduleDonation: (donor: Donor) => void
}): ColumnDef<Donor>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Donor" />,
      cell: ({ row }) => {
        const donor = row.original
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={donor.name} seed={donor.avatarSeed} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{donor.name}</span>
              <span className="text-xs text-muted-foreground">{donor.id}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "bloodType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Blood Group" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.bloodType}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone}</span>,
    },
    {
      accessorKey: "lastDonationDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Donation" />,
      cell: ({ row }) =>
        row.original.lastDonationDate ? (
          <span className="text-muted-foreground">{format(new Date(row.original.lastDonationDate), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-muted-foreground">No donations yet</span>
        ),
    },
    {
      accessorKey: "eligible",
      header: "Eligible",
      cell: ({ row }) =>
        row.original.eligible ? (
          <StatusBadge status="Eligible" tone="green" />
        ) : (
          <StatusBadge status="Not Eligible" tone="red" />
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const donor = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(donor)}>
                <EyeIcon />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!donor.eligible} onClick={() => onScheduleDonation(donor)}>
                <CalendarPlusIcon />
                Schedule Donation
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href={`tel:${donor.phone}`} />}>
                <PhoneIcon />
                Contact Donor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getDonorColumns }
