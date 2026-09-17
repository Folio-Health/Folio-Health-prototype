"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowRightIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import type { Appointment } from "@/types/core"

export const consultationColumns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "startTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
    cell: ({ row }) => (
      <span className="font-medium tabular-nums text-foreground">
        {format(new Date(row.original.startTime), "h:mm a")}
      </span>
    ),
  },
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = getPatientById(row.original.patientId)
      if (!patient) return <span className="text-muted-foreground">Unknown patient</span>
      return (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{patient.name}</span>
            <span className="text-xs text-muted-foreground">{patient.mrn}</span>
          </div>
        </div>
      )
    },
  },
  {
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => {
      const doctor = getStaffById(row.original.doctorId)
      return <span className="text-muted-foreground">{doctor?.name ?? "Unassigned"}</span>
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.reason}</span>,
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
      <Button
        size="sm"
        className="text-xs"
        render={<Link href={`/consultation/${row.original.id}`} />}
        onClick={(e) => e.stopPropagation()}
      >
        Open
        <ArrowRightIcon className="size-3.5" />
      </Button>
    ),
  },
]
