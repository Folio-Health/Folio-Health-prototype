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
        const { patientId, patientName } = row.original as Admission & { patientName?: string }
        const label = patientName ?? "Patient"
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={label} seed={patientId} size="sm" />
            <span className="font-medium text-foreground">{label}</span>
          </div>
        )
      },
    },
    {
      id: "ward",
      header: "Ward",
      // Ward names are held by the queue's wards query; the id alone is shown
      // here rather than threading a second lookup through this column set.
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.wardId || "Unassigned"}</span>
      ),
    },
    {
      id: "doctor",
      header: "Admitting Doctor",
      cell: ({ row }) => {
        const { doctorId } = row.original
        return (
          <span className="text-muted-foreground">
            {doctorId ? `Practitioner/${doctorId}` : "Unassigned"}
          </span>
        )
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
