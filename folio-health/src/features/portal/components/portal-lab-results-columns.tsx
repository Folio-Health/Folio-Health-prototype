"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { EyeIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { LabResult } from "@/lib/mock/laboratory"

function getPortalLabResultColumns({
  onView,
}: {
  onView: (result: LabResult) => void
}): ColumnDef<LabResult>[] {
  return [
    {
      accessorKey: "testName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Test Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.testName}</span>
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
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={(e) => {
            e.stopPropagation()
            onView(row.original)
          }}
        >
          <EyeIcon className="size-3.5" />
          View Result
        </Button>
      ),
    },
  ]
}

export { getPortalLabResultColumns }
