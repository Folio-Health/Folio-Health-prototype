"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, CheckCircleIcon, PrinterIcon } from "lucide-react"
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
        const { patientId, patientName } = row.original as LabResult & { patientName?: string }
        // The result is real even when the name include is unavailable, so the
        // row still links to the patient rather than reading "Unknown".
        const label = patientName ?? "View patient"
        return (
          <Link
            href={`/patients/${patientId}`}
            className="flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <PersonAvatar name={label} seed={patientId} size="sm" />
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {label}
            </span>
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
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/laboratory/${result.id}`} />}>
                <EyeIcon />
                View Result
              </DropdownMenuItem>
              <RoleGate permission="LAB_RELEASE_RESULT">
                <DropdownMenuItem
                  disabled={result.workflowStatus !== "Completed"}
                  onClick={() => onApprove(result)}
                >
                  <CheckCircleIcon />
                  Approve
                </DropdownMenuItem>
              </RoleGate>
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
