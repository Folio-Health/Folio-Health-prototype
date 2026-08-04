"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import type { NursingNote } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

const nursingNotesColumns: ColumnDef<NursingNote>[] = [
  {
    id: "patient",
    accessorFn: (row) => getPatientById(row.patientId)?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    cell: ({ row }) => {
      const patient = getPatientById(row.original.patientId)
      if (!patient) return <span className="text-muted-foreground">Unknown</span>
      return (
        <Link
          href={`/patients/${patient.id}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
          <span className="font-medium text-foreground hover:text-primary hover:underline">
            {patient.name}
          </span>
        </Link>
      )
    },
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-md text-foreground">{row.original.note}</span>
    ),
  },
  {
    id: "author",
    header: "Author",
    cell: ({ row }) => {
      const author = getStaffById(row.original.authorStaffId)
      return <span className="text-muted-foreground">{author?.name ?? "Unknown"}</span>
    },
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recorded" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(new Date(row.original.timestamp), "MMM d, yyyy · h:mm a")}
      </span>
    ),
  },
]

export { nursingNotesColumns }
