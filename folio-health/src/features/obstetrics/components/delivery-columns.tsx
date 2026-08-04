"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import type { DeliveryRecord } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

const deliveryColumns: ColumnDef<DeliveryRecord>[] = [
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
    accessorKey: "deliveryDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery Date" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(new Date(row.original.deliveryDate), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <StatusBadge status={row.original.type} tone={row.original.type === "C-Section" ? "violet" : "blue"} />
    ),
  },
  {
    accessorKey: "babyWeight",
    header: "Baby Weight",
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.babyWeight} kg</span>,
  },
  {
    accessorKey: "babyGender",
    header: "Baby Gender",
  },
  {
    accessorKey: "complications",
    header: "Complications",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.complications}
        tone={row.original.complications === "None" ? "green" : "amber"}
      />
    ),
  },
  {
    id: "attendingDoctor",
    header: "Attending Doctor",
    cell: ({ row }) => {
      const doctor = getStaffById(row.original.attendingDoctorId)
      return <span className="text-muted-foreground">{doctor?.name ?? "Unknown"}</span>
    },
  },
]

export { deliveryColumns }
