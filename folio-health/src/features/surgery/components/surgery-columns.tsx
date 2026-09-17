"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, ClipboardListIcon, FileTextIcon } from "lucide-react"
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
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import type { Surgery } from "@/lib/mock/surgery"

export const surgeryColumns: ColumnDef<Surgery>[] = [
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = getPatientById(row.original.patientId)
      if (!patient) return <span className="text-muted-foreground">Unknown patient</span>
      return (
        <Link
          href={`/patients/${patient.id}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {patient.name}
            </span>
            <span className="text-xs text-muted-foreground">{patient.mrn}</span>
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "procedure",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Procedure" />,
    cell: ({ row }) => <span className="text-foreground">{row.original.procedure}</span>,
  },
  {
    id: "surgeon",
    header: "Surgeon",
    cell: ({ row }) => {
      const surgeon = getStaffById(row.original.surgeonId)
      return <span className="text-muted-foreground">{surgeon?.name ?? "Unassigned"}</span>
    },
  },
  {
    accessorKey: "theatreNumber",
    header: "Theatre",
    cell: ({ row }) => <span className="tabular-nums text-foreground">Theatre {row.original.theatreNumber}</span>,
  },
  {
    accessorKey: "scheduledTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Scheduled Time" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.scheduledTime), "MMM d, h:mm a")}
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
    cell: ({ row }) => {
      const surgery = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/patients/${surgery.patientId}`} />}>
              <EyeIcon />
              View Patient
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/surgery/pre-op" />}>
              <ClipboardListIcon />
              Pre Op Checklist
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/surgery/procedure-notes" />}>
              <FileTextIcon />
              Procedure Notes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
