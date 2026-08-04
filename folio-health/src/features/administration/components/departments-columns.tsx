"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, PencilIcon, UsersIcon } from "lucide-react"
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
import type { DepartmentSummary } from "@/lib/mock/hr"

function getDepartmentTableColumns({
  onEdit,
}: {
  onEdit: (dept: DepartmentSummary) => void
}): ColumnDef<DepartmentSummary>[] {
  return [
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department Name" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.department}</span>,
    },
    {
      id: "head",
      header: "Head of Department",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={row.original.head} size="sm" />
          <span className="text-muted-foreground">{row.original.head}</span>
        </div>
      ),
    },
    {
      accessorKey: "staffCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Staff Count" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
          <UsersIcon className="size-3.5 text-muted-foreground" />
          {row.original.staffCount}
        </span>
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/hr" />}>
              <UsersIcon />
              View Staff
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export { getDepartmentTableColumns }
