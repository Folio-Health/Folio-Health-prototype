"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { SearchIcon, ClipboardCheckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { RoleGate } from "@/components/common/role-gate"
import { getTodaysAppointments } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import type { Appointment, AppointmentStatus } from "@/types/core"

interface CheckInRow extends Appointment {
  patientName: string
  patientMrn: string
  patientSeed: string
  doctorName: string
}

function CheckInList() {
  const [search, setSearch] = useState("")
  const [statuses, setStatuses] = useState<Record<string, AppointmentStatus>>(() => {
    const initial: Record<string, AppointmentStatus> = {}
    for (const apt of getTodaysAppointments()) initial[apt.id] = apt.status
    return initial
  })

  const rows: CheckInRow[] = useMemo(() => {
    return getTodaysAppointments()
      .map((apt) => {
        const patient = getPatientById(apt.patientId)
        const doctor = getStaffById(apt.doctorId)
        if (!patient) return null
        return {
          ...apt,
          status: statuses[apt.id] ?? apt.status,
          patientName: patient.name,
          patientMrn: patient.mrn,
          patientSeed: patient.avatarSeed,
          doctorName: doctor?.name ?? "Unassigned",
        }
      })
      .filter((r): r is CheckInRow => r !== null)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [statuses])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()
    return rows.filter(
      (r) => r.patientName.toLowerCase().includes(q) || r.patientMrn.toLowerCase().includes(q)
    )
  }, [rows, search])

  function checkIn(row: CheckInRow) {
    setStatuses((prev) => ({ ...prev, [row.id]: "Checked In" }))
    toast.success(`${row.patientName} checked in`, {
      description: `Now waiting for ${row.doctorName}.`,
    })
  }

  const checkedInCount = rows.filter((r) => r.status === "Checked In").length

  const columns: ColumnDef<CheckInRow>[] = [
    {
      accessorKey: "patientName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={row.original.patientName} seed={row.original.patientSeed} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.patientName}</span>
            <span className="text-xs text-muted-foreground">{row.original.patientMrn}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.doctorName}</span>,
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {new Date(row.original.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      ),
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
      cell: ({ row }) => {
        const isCheckedIn = !["Scheduled"].includes(row.original.status)
        return (
          <div className="flex justify-end">
            <RoleGate roles={["front-desk", "facility-admin"]}>
              <Button
                size="sm"
                variant={isCheckedIn ? "outline" : "default"}
                disabled={isCheckedIn}
                onClick={(e) => {
                  e.stopPropagation()
                  checkIn(row.original)
                }}
              >
                <ClipboardCheckIcon />
                {isCheckedIn ? "Checked In" : "Check In"}
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
        title="Check In"
        description={`${checkedInCount} of ${rows.length} today's appointments checked in`}
        breadcrumbs={[{ label: "Front Desk" }, { label: "Reception", href: "/reception" }, { label: "Check In" }]}
      />

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No appointments today"
        emptyDescription="There are no scheduled appointments for today."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by patient name or MRN..."
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
