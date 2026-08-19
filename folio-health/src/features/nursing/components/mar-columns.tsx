"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { RoleGate } from "@/components/common/role-gate"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { MedicationOrder } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

function getMarColumns({
  onMarkGiven,
}: {
  onMarkGiven: (order: MedicationOrder) => void
}): ColumnDef<MedicationOrder>[] {
  return [
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
      accessorKey: "drug",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Drug" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.drug}</span>,
    },
    {
      accessorKey: "dose",
      header: "Dose",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.dose}</span>,
    },
    {
      accessorKey: "scheduledTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Scheduled Time" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
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
      id: "administeredBy",
      header: "Administered By",
      cell: ({ row }) => {
        const staffId = row.original.administeredByStaffId
        const staff = staffId ? getStaffById(staffId) : undefined
        return <span className="text-muted-foreground">{staff?.name ?? "N/A"}</span>
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original
        return (
          <RoleGate permission="ADMINISTER">
            <Button
              variant="outline"
              size="sm"
              disabled={order.status === "Given"}
              onClick={(e) => {
                e.stopPropagation()
                onMarkGiven(order)
              }}
            >
              <CheckIcon />
              Mark as Given
            </Button>
          </RoleGate>
        )
      },
    },
  ]
}

export { getMarColumns }
