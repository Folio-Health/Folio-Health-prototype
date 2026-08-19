"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, EyeIcon, LineChartIcon, SyringeIcon } from "lucide-react"
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
import { getVaccinationsForPatient } from "@/lib/mock/pediatrics"
import type { Patient } from "@/types/core"

function vaccinationSummary(patientId: string): string {
  const records = getVaccinationsForPatient(patientId)
  if (records.some((r) => r.status === "Overdue")) return "Overdue"
  if (records.some((r) => r.status === "Due")) return "Due"
  return "Up to date"
}

const pediatricsColumns: ColumnDef<Patient>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    cell: ({ row }) => {
      const patient = row.original
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
    accessorKey: "age",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.age} yrs</span>,
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    id: "guardian",
    header: "Guardian Contact",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.emergencyContact.name}</span>,
  },
  {
    id: "vaccinationStatus",
    header: "Vaccination Status",
    cell: ({ row }) => <StatusBadge status={vaccinationSummary(row.original.id)} />,
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
          <DropdownMenuItem render={<Link href={`/patients/${row.original.id}`} />}>
            <EyeIcon />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/pediatrics/growth-charts" />}>
            <LineChartIcon />
            View Growth Chart
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/pediatrics/vaccinations" />}>
            <SyringeIcon />
            View Vaccinations
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export { pediatricsColumns }
