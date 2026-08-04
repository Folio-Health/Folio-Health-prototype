"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, PrinterIcon } from "lucide-react"
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
import type { ConsentForm } from "@/lib/mock/surgery"

function consentFormsColumns(
  onView: (form: ConsentForm) => void,
  onPrint: (form: ConsentForm) => void
): ColumnDef<ConsentForm>[] {
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
      accessorKey: "procedure",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Procedure" />,
      cell: ({ row }) => <span className="text-foreground">{row.original.procedure}</span>,
    },
    {
      id: "signedBy",
      header: "Signed By",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.signedBy ?? "N/A"}</span>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Signed" />,
      cell: ({ row }) =>
        row.original.signed ? (
          <span className="text-muted-foreground">{format(new Date(row.original.date), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.signed ? "Signed" : "Pending"} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const form = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(form)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!form.signed} onClick={() => onPrint(form)}>
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

export { consentFormsColumns }
