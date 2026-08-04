"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import type { PostnatalRecord } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"

const STATUS_TONE = { Scheduled: "blue", Completed: "green", Missed: "red" } as const

const postnatalColumns: ColumnDef<PostnatalRecord>[] = [
  {
    id: "mother",
    accessorFn: (row) => getPatientById(row.motherPatientId)?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mother" />,
    cell: ({ row }) => {
      const patient = getPatientById(row.original.motherPatientId)
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
    accessorKey: "deliveryDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery Date" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(new Date(row.original.deliveryDate), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "followUpDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Follow-up Date" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(new Date(row.original.followUpDate), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "motherCondition",
    header: "Mother's Condition",
    cell: ({ row }) => <span className="text-foreground">{row.original.motherCondition}</span>,
  },
  {
    accessorKey: "babyCondition",
    header: "Baby's Condition",
    cell: ({ row }) => <span className="text-foreground">{row.original.babyCondition}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />,
  },
]

export { postnatalColumns }
