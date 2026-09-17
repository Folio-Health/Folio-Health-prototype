"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, StethoscopeIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { triageMeta } from "@/lib/mock/emergency"
import type { ERCase } from "@/lib/mock/emergency"

const TRIAGE_TONE: Record<"Critical" | "Urgent" | "Standard", "red" | "amber" | "blue"> = {
  Critical: "red",
  Urgent: "amber",
  Standard: "blue",
}

const STATUS_TONE: Record<string, "amber" | "blue" | "green" | "slate"> = {
  Waiting: "amber",
  "In Treatment": "blue",
  Admitted: "blue",
  Discharged: "slate",
}

export const emergencyColumns: ColumnDef<ERCase>[] = [
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = getPatientById(row.original.patientId)
      if (!patient) return <span className="text-muted-foreground">Unknown patient</span>
      return (
        <Link
          href={`/patients/${patient.id}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {patient.name}
            </span>
            <span className="text-xs text-muted-foreground">{patient.mrn}</span>
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "arrivalTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Arrival Time" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{format(new Date(row.original.arrivalTime), "MMM d, h:mm a")}</span>
    ),
  },
  {
    id: "triage",
    header: "Triage Level",
    cell: ({ row }) => {
      const meta = triageMeta(row.original.triageLevel)
      return <StatusBadge status={meta.badgeLabel} tone={TRIAGE_TONE[meta.badgeLabel]} />
    },
  },
  {
    accessorKey: "chiefComplaint",
    header: "Chief Complaint",
    cell: ({ row }) => <span className="text-foreground">{row.original.chiefComplaint}</span>,
  },
  {
    id: "doctor",
    header: "Assigned Doctor",
    cell: ({ row }) => {
      const doctor = getStaffById(row.original.assignedDoctorId)
      return <span className="text-muted-foreground">{doctor?.name ?? "Unassigned"}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const erCase = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/patients/${erCase.patientId}`} />}>
              <EyeIcon />
              View Patient
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/emergency/triage" />}>
              <StethoscopeIcon />
              Update Triage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
