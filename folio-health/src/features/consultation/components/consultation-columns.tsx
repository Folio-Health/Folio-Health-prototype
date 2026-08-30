"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import type { Appointment } from "@medplum/fhirtypes"
import { format } from "date-fns"
import { ArrowRightIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  appointmentPatient,
  appointmentPractitioner,
  type AppointmentStatus,
} from "@/lib/appointments/logic"

/**
 * Today's consultations, rendered straight from FHIR Appointments.
 *
 * The mock `Appointment` shape this used to take had `patientId`/`doctorId`
 * that were looked up in the mock staff and patient tables. Those tables are
 * empty now, so every row read "Unknown patient". FHIR carries the names on
 * the participants themselves, so no lookup is needed at all.
 */

/** The UI's plain-English label for a FHIR appointment status. */
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: "Booked",
  arrived: "Checked In",
  fulfilled: "Completed",
  cancelled: "Cancelled",
  noshow: "No Show",
}

function statusLabel(appointment: Appointment): string {
  const status = appointment.status as AppointmentStatus
  return STATUS_LABELS[status] ?? appointment.status ?? "Unknown"
}

export const consultationColumns: ColumnDef<Appointment>[] = [
  {
    id: "time",
    accessorFn: (row) => row.start ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
    cell: ({ row }) => (
      <span className="font-medium tabular-nums text-foreground">
        {row.original.start ? format(new Date(row.original.start), "h:mm a") : "—"}
      </span>
    ),
  },
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = appointmentPatient(row.original)
      const name = patient?.display ?? "Unknown patient"
      return (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={name} seed={patient?.reference ?? name} size="sm" />
          <span className="font-medium text-foreground">{name}</span>
        </div>
      )
    },
  },
  {
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => {
      const practitioner = appointmentPractitioner(row.original)
      return (
        <span className="text-muted-foreground">{practitioner?.display ?? "Unassigned"}</span>
      )
    },
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.appointmentType?.text ??
          row.original.appointmentType?.coding?.[0]?.display ??
          "Consultation"}
      </span>
    ),
  },
  {
    id: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.reasonCode?.[0]?.text ?? row.original.description ?? "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={statusLabel(row.original)} />,
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
