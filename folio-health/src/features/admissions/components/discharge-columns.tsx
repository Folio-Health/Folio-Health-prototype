"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, DoorOpenIcon, PrinterIcon } from "lucide-react"
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
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { getWardById } from "@/lib/mock/admissions"
import type { Admission } from "@/lib/mock/admissions"

function dischargeColumns(
  onComplete: (admission: Admission) => void,
  onPrint: (admission: Admission) => void
): ColumnDef<Admission>[] {
  return [
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
      id: "ward",
      header: "Ward",
      cell: ({ row }) => {
        const ward = getWardById(row.original.wardId)
        return <span className="text-muted-foreground">{ward?.name ?? "N/A"}</span>
      },
    },
    {
      id: "doctor",
      header: "Admitting Doctor",
      cell: ({ row }) => {
        const doctor = getStaffById(row.original.doctorId)
        return <span className="text-muted-foreground">{doctor?.name ?? "Unassigned"}</span>
      },
    },
    {
      id: "plannedDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Planned Discharge" />,
      cell: () => <span className="text-foreground">{format(new Date(), "MMM d, yyyy")}</span>,
    },
    {
      id: "summary",
      header: "Discharge Summary",
      cell: ({ row }) => (
        <StatusBadge status={row.original.dischargeSummaryReady ? "Completed" : "Pending"} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const admission = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <RoleGate roles={["doctor", "nurse"]}>
                <DropdownMenuItem onClick={() => onComplete(admission)}>
                  <DoorOpenIcon />
                  Complete Discharge
                </DropdownMenuItem>
              </RoleGate>
              <DropdownMenuItem
                disabled={!admission.dischargeSummaryReady}
                onClick={() => onPrint(admission)}
              >
                <PrinterIcon />
                Print Summary
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { dischargeColumns }
