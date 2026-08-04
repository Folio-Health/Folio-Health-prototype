"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import type { DevelopmentMilestone } from "@/lib/mock/pediatrics"
import { getPediatricPatientById } from "@/lib/mock/pediatrics"

const CATEGORY_TONE = {
  Motor: "blue",
  Language: "violet",
  Social: "amber",
  Cognitive: "cyan",
} as const

const MILESTONE_STATUS_TONE = {
  Achieved: "green",
  Delayed: "red",
  Pending: "amber",
} as const

function formatExpectedAge(months: number): string {
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (years === 0) return `${remMonths} mo`
  return remMonths === 0 ? `${years} yr` : `${years} yr ${remMonths} mo`
}

const developmentColumns: ColumnDef<DevelopmentMilestone>[] = [
  {
    id: "patient",
    accessorFn: (row) => getPediatricPatientById(row.patientId)?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    cell: ({ row }) => {
      const patient = getPediatricPatientById(row.original.patientId)
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
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <StatusBadge status={row.original.category} tone={CATEGORY_TONE[row.original.category]} />
    ),
  },
  {
    accessorKey: "milestone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Milestone" />,
    cell: ({ row }) => <span className="text-foreground">{row.original.milestone}</span>,
  },
  {
    accessorKey: "expectedAgeMonths",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expected Age" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">{formatExpectedAge(row.original.expectedAgeMonths)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} tone={MILESTONE_STATUS_TONE[row.original.status]} />
    ),
  },
]

export { developmentColumns }
