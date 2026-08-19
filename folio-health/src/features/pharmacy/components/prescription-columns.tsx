"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, PillIcon, PrinterIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import type { Prescription } from "@/lib/mock/pharmacy"

function getPrescriptionColumns({
  onView,
  onDispense,
  onPrint,
}: {
  onView: (rx: Prescription) => void
  onDispense: (rx: Prescription) => void
  onPrint: (rx: Prescription) => void
}): ColumnDef<Prescription>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rx ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const patient = getPatientById(row.original.patientId)
        if (!patient) return <span className="text-muted-foreground">Unknown</span>
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
      id: "medications",
      header: "Medications",
      cell: ({ row }) => {
        const meds = row.original.medications
        return (
          <div className="flex flex-col">
            <span className="text-foreground">
              {meds[0]?.drugName} <span className="text-xs text-muted-foreground">{meds[0]?.dosage}</span>
            </span>
            {meds.length > 1 && (
              <span className="text-xs text-muted-foreground">+{meds.length - 1} more</span>
            )}
          </div>
        )
      },
    },
    {
      id: "prescribedBy",
      header: "Prescribed By",
      cell: ({ row }) => {
        const doctor = getStaffById(row.original.prescribedByStaffId)
        return <span className="text-muted-foreground">{doctor?.name ?? "N/A"}</span>
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy")}</span>
      ),
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
        const rx = row.original
        const canDispense = rx.status === "To Dispense"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(rx)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <RoleGate permission="PHARMACY_DISPENSE">
                <DropdownMenuItem disabled={!canDispense} onClick={() => onDispense(rx)}>
                  <PillIcon />
                  Dispense
                </DropdownMenuItem>
              </RoleGate>
              <DropdownMenuItem onClick={() => onPrint(rx)}>
                <PrinterIcon />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getPrescriptionColumns }
