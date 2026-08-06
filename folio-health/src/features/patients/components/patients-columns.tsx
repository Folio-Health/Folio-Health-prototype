"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, EyeIcon, PencilIcon, FileTextIcon } from "lucide-react"
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
import type { PatientSummary } from "@/lib/fhir/patient"

/**
 * Columns render only what a FHIR `Patient` actually carries.
 *
 * The previous version had a "Doctor" column printing `primaryDoctorId` raw
 * (e.g. "STF-0012") and a "Last Visit" column from an invented field. The
 * treating clinician is `generalPractitioner` and the last visit is the most
 * recent `Encounter` — both separate reads, so they belong on the profile
 * screen rather than being faked in a list cell.
 */
export const patientsColumns: ColumnDef<PatientSummary>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    cell: ({ row }) => {
      const patient = row.original
      return (
        <Link
          href={`/patients/${patient.id}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <PersonAvatar name={patient.name} seed={patient.id} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {patient.name}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{patient.mrn}</span>
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "age",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.age ?? <span className="text-muted-foreground">Unknown</span>}
      </span>
    ),
  },
  {
    accessorKey: "gender",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gender" />,
  },
  {
    accessorKey: "dob",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date of Birth" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">{row.original.dob ?? "—"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">{row.original.phone || "—"}</span>
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
          <DropdownMenuItem render={<Link href={`/patients/${row.original.id}`} />}>
            <EyeIcon />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PencilIcon />
            Edit Patient
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileTextIcon />
            View Documents
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
