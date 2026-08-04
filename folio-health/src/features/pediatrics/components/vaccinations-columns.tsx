"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { Vaccination } from "@/lib/mock/pediatrics"
import { getPediatricPatientById } from "@/lib/mock/pediatrics"

function getVaccinationsColumns({
  onMarkAdministered,
}: {
  onMarkAdministered: (vaccination: Vaccination) => void
}): ColumnDef<Vaccination>[] {
  return [
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
      accessorKey: "vaccineName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vaccine" />,
      cell: ({ row }) => <span className="text-foreground">{row.original.vaccineName}</span>,
    },
    {
      accessorKey: "doseNumber",
      header: "Dose #",
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.doseNumber}</span>,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.dueDate), "MMM d, yyyy")}
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
        const vaccination = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={vaccination.status === "Completed"}
            onClick={(e) => {
              e.stopPropagation()
              onMarkAdministered(vaccination)
            }}
          >
            <CheckIcon />
            Mark as Administered
          </Button>
        )
      },
    },
  ]
}

export { getVaccinationsColumns }
