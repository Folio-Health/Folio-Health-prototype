"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Appointment } from "@medplum/fhirtypes"
import { toast } from "sonner"
import { SearchIcon, ClipboardCheckIcon, Loader2Icon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { RoleGate } from "@/components/common/role-gate"
import {
  useAppointmentAction,
  useAppointmentsForDay,
} from "@/features/appointments/hooks/use-appointments"
import {
  allowedActions,
  appointmentPatient,
  appointmentPractitioner,
  type AppointmentStatus,
} from "@/lib/appointments/logic"

/**
 * Front-desk check-in for today's appointments.
 *
 * Check-in writes through /api/appointments, where the state machine lives, so
 * the button can only ever REQUEST a transition. Previously it set a local
 * status map: the row turned green, nothing reached the server, and the next
 * person to open the page saw the patient still waiting.
 */

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: "Scheduled",
  arrived: "Checked In",
  fulfilled: "Completed",
  cancelled: "Cancelled",
  noshow: "No Show",
}

interface CheckInRow {
  appointment: Appointment
  id: string
  patientName: string
  patientRef: string
  doctorName: string
  start: string
  status: AppointmentStatus
  reason: string
}

function toRow(appointment: Appointment): CheckInRow | null {
  if (!appointment.id) return null
  const patient = appointmentPatient(appointment)
  const practitioner = appointmentPractitioner(appointment)
  return {
    appointment,
    id: appointment.id,
    patientName: patient?.display ?? "Unknown patient",
    patientRef: patient?.reference ?? appointment.id,
    doctorName: practitioner?.display ?? "Unassigned",
    start: appointment.start ?? "",
    status: (appointment.status as AppointmentStatus) ?? "booked",
    reason: appointment.reasonCode?.[0]?.text ?? appointment.description ?? "—",
  }
}

function CheckInList() {
  const [search, setSearch] = useState("")
  // Held in state so the query key is stable across renders.
  const [today] = useState(() => new Date())
  const { data, isLoading, isError } = useAppointmentsForDay(today)
  const action = useAppointmentAction()

  // `null` is the hook's "your role has no Appointment grant" signal, which is
  // a different statement from "nobody is booked today".
  const notPermitted = data === null

  const rows: CheckInRow[] = useMemo(
    () =>
      (data ?? [])
        .map(toRow)
        .filter((r): r is CheckInRow => r !== null)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [data]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()
    return rows.filter((r) => r.patientName.toLowerCase().includes(q))
  }, [rows, search])

  async function checkIn(row: CheckInRow) {
    try {
      await action.mutateAsync({ id: row.id, action: "check-in" })
      toast.success(`${row.patientName} checked in`, {
        description: `Now waiting for ${row.doctorName}.`,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check the patient in")
    }
  }

  const checkedInCount = rows.filter((r) => r.status === "arrived").length

  const columns: ColumnDef<CheckInRow>[] = [
    {
      accessorKey: "patientName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <PersonAvatar
            name={row.original.patientName}
            seed={row.original.patientRef}
            size="sm"
          />
          <span className="font-medium text-foreground">{row.original.patientName}</span>
        </div>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.doctorName}</span>,
    },
    {
      accessorKey: "start",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.start
            ? new Date(row.original.start).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.appointment.appointmentType?.text ?? "Consultation"}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.reason}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={STATUS_LABELS[row.original.status]} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        // Asked of the state machine rather than re-derived here: one source of
        // truth for what may follow what, shared with the server that enforces it.
        const canCheckIn = allowedActions(row.original.status).includes("check-in")
        const isPending = action.isPending && action.variables?.id === row.original.id
        return (
          <div className="flex justify-end">
            <RoleGate roles={["front-desk", "facility-admin"]}>
              <Button
                size="sm"
                variant={canCheckIn ? "default" : "outline"}
                disabled={!canCheckIn || isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  checkIn(row.original)
                }}
              >
                {isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ClipboardCheckIcon />
                )}
                {canCheckIn ? "Check In" : STATUS_LABELS[row.original.status]}
              </Button>
            </RoleGate>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Check-In"
        description={
          isLoading
            ? "Loading today's appointments..."
            : `${checkedInCount} of ${rows.length} patients checked in`
        }
        breadcrumbs={[{ label: "Front Desk" }, { label: "Check-In" }]}
      />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle={
          notPermitted
            ? "Not available for your role"
            : isError
              ? "Could not load appointments"
              : "No appointments today"
        }
        emptyDescription={
          notPermitted
            ? "Your role does not have access to the appointment schedule."
            : isError
              ? "Check your connection and try again."
              : "Patients booked for today will appear here for check-in."
        }
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />
    </div>
  )
}

export { CheckInList }
