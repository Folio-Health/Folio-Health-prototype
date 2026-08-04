"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, CheckCircleIcon, PrinterIcon } from "lucide-react"
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
import type { LabResult } from "@/lib/mock/laboratory"

function getLabColumns({
  onApprove,
  onPrint,
}: {
  onApprove: (result: LabResult) => void
  onPrint: (result: LabResult) => void
}): ColumnDef<LabResult>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Test ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
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
      accessorKey: "testName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Test Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-foreground">{row.original.testName}</span>
          <span className="text-xs text-muted-foreground">{row.original.testType}</span>
        </div>
      ),
    },
    {
      accessorKey: "resultSummary",
      header: "Result",
      cell: ({ row }) => <span className="tabular-nums text-foreground">{row.original.resultSummary}</span>,
    },
    {
      accessorKey: "referenceRangeSummary",
      header: "Reference Range",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{row.original.referenceRangeSummary}</span>
      ),
    },
    {
      accessorKey: "displayStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.displayStatus} />,
    },
    {
      accessorKey: "orderedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.orderedAt), "MMM d, yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const result = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/laboratory/${result.id}`} />}>
                <EyeIcon />
                View Result
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={result.workflowStatus !== "Completed"}
                onClick={() => onApprove(result)}
              >
                <CheckCircleIcon />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint(result)}>
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

export { getLabColumns }
