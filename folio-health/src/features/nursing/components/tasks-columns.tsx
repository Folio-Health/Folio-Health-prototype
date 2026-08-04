"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import type { NursingTask } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"
import { cn } from "@/lib/utils"

const PRIORITY_TONE = {
  Low: "slate",
  Medium: "blue",
  High: "red",
} as const

function getTasksColumns({
  onToggleDone,
}: {
  onToggleDone: (task: NursingTask) => void
}): ColumnDef<NursingTask>[] {
  return [
    {
      id: "done",
      header: "",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.status === "Done"}
          onCheckedChange={() => onToggleDone(row.original)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      accessorKey: "task",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
      cell: ({ row }) => (
        <span
          className={cn(
            "font-medium text-foreground",
            row.original.status === "Done" && "text-muted-foreground line-through"
          )}
        >
          {row.original.task}
        </span>
      ),
    },
    {
      id: "patient",
      accessorFn: (row) => getPatientById(row.patientId)?.name ?? "",
      header: "Patient",
      cell: ({ row }) => {
        const patient = getPatientById(row.original.patientId)
        if (!patient) return <span className="text-muted-foreground">Unknown</span>
        return (
          <Link
            href={`/patients/${patient.id}`}
            className="text-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {patient.name}
          </Link>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <StatusBadge status={row.original.priority} tone={PRIORITY_TONE[row.original.priority]} />
      ),
    },
    {
      accessorKey: "dueTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Time" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.dueTime), "MMM d, h:mm a")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]
}

export { getTasksColumns }
