"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, ClipboardPlusIcon, ActivityIcon, EyeIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { RoleGate } from "@/components/common/role-gate"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NursingAssignment } from "@/lib/mock/nursing"
import type { Patient } from "@/types/core"

export interface AssignedPatientRow {
  assignment: NursingAssignment
  patient: Patient
}

function getAssignedPatientsColumns({
  onRecordVitals,
}: {
  onRecordVitals: (row: AssignedPatientRow) => void
}): ColumnDef<AssignedPatientRow>[] {
  return [
    {
      id: "patient",
      accessorFn: (row) => row.patient.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
      cell: ({ row }) => {
        const { patient } = row.original
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
      id: "roomBed",
      header: "Room / Bed",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          Room {row.original.assignment.room} &middot; Bed {row.original.assignment.bed}
        </span>
      ),
    },
    {
      id: "diagnosis",
      header: "Primary Diagnosis",
      cell: ({ row }) => <span className="text-foreground">{row.original.assignment.primaryDiagnosis}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.assignment.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/patients/${row.original.patient.id}`} />}>
              <EyeIcon />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/nursing/care-plans" />}>
              <ClipboardPlusIcon />
              View Care Plan
            </DropdownMenuItem>
            <RoleGate roles={["nurse", "doctor"]}>
              <DropdownMenuItem onClick={() => onRecordVitals(row.original)}>
                <ActivityIcon />
                Record Vitals
              </DropdownMenuItem>
            </RoleGate>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export { getAssignedPatientsColumns }
