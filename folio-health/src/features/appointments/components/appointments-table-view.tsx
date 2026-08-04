"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTable } from "@/components/tables/data-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

const rows = APPOINTMENTS.map((apt) => ({
  ...apt,
  patient: getPatientById(apt.patientId),
  doctor: getStaffById(apt.doctorId),
})).filter((r) => r.patient && r.doctor)

const columns: ColumnDef<(typeof rows)[number]>[] = [
  {
    id: "patient",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    accessorFn: (row) => row.patient?.name,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <PersonAvatar name={row.original.patient!.name} size="sm" />
        <span className="font-medium text-foreground">{row.original.patient!.name}</span>
      </div>
    ),
  },
  {
    id: "doctor",
    header: "Doctor",
    accessorFn: (row) => row.doctor?.name,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.doctor!.name}</span>,
  },
  { accessorKey: "department", header: "Department" },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => format(new Date(row.original.startTime), "MMM d, yyyy"),
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => format(new Date(row.original.startTime), "h:mm a"),
  },
  { accessorKey: "type", header: "Type" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

function AppointmentsTableView() {
  return <DataTable columns={columns} data={rows} />
}

export { AppointmentsTableView }
