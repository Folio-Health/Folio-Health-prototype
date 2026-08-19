"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, CalendarPlusIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AntenatalVisit } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"

function getAntenatalColumns({
  onScheduleNext,
}: {
  onScheduleNext: (visit: AntenatalVisit) => void
}): ColumnDef<AntenatalVisit>[] {
  return [
    {
      id: "patient",
      accessorFn: (row) => getPatientById(row.patientId)?.name ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
      cell: ({ row }) => {
        const patient = getPatientById(row.original.patientId)
        if (!patient) return <span className="text-muted-foreground">Unknown</span>
        return (
          <Link
            href={`/patients/${patient.id}`}
            className="flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {patient.name}
            </span>
          </Link>
        )
      },
    },
    {
      accessorKey: "visitNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Visit #" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.visitNumber}</span>,
    },
    {
      accessorKey: "gestationalWeek",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Gestational Week" />,
      cell: ({ row }) => <span className="tabular-nums">Week {row.original.gestationalWeek}</span>,
    },
    {
      id: "bp",
      header: "BP",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.bpSystolic}/{row.original.bpDiastolic}
        </span>
      ),
    },
    {
      accessorKey: "weight",
      header: "Weight",
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.weight} kg</span>,
    },
    {
      accessorKey: "fundalHeight",
      header: "Fundal Height",
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.fundalHeight} cm</span>,
    },
    {
      accessorKey: "nextVisitDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Next Visit" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.nextVisitDate), "MMM d, yyyy")}
        </span>
      ),
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
            <DropdownMenuItem render={<Link href={`/patients/${row.original.patientId}`} />}>
              <EyeIcon />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onScheduleNext(row.original)}>
              <CalendarPlusIcon />
              Schedule Next Visit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export { getAntenatalColumns }
