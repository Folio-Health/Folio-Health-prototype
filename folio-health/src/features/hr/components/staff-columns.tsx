"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, EyeIcon, PencilIcon, UserXIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StaffMember } from "@/types/core"

function getStaffColumns({
  onView,
  onEdit,
  onDeactivate,
}: {
  onView: (staff: StaffMember) => void
  onEdit: (staff: StaffMember) => void
  onDeactivate: (staff: StaffMember) => void
}): ColumnDef<StaffMember>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Staff" />,
      cell: ({ row }) => {
        const staff = row.original
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={staff.name} seed={staff.avatarSeed} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{staff.name}</span>
              <span className="text-xs text-muted-foreground">{staff.staffId}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.department}</span>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.title}</span>,
    },
    {
      accessorKey: "shift",
      header: "Shift",
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
        const staff = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(staff)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(staff)}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={staff.status === "Inactive"}
                onClick={() => onDeactivate(staff)}
              >
                <UserXIcon />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getStaffColumns }
