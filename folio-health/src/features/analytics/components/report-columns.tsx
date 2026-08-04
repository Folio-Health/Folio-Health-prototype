"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { EyeIcon, DownloadIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Button } from "@/components/ui/button"
import type { ReportLineItem } from "@/lib/mock/analytics"

function getReportColumns({
  onView,
  onDownload,
}: {
  onView: (report: ReportLineItem) => void
  onDownload: (report: ReportLineItem) => void
}): ColumnDef<ReportLineItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Report Name" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "period",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.period}</span>,
    },
    {
      accessorKey: "generatedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Generated Date" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.generatedAt), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const report = row.original
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onView(report)
              }}
            >
              <EyeIcon className="size-3.5" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onDownload(report)
              }}
            >
              <DownloadIcon className="size-3.5" />
              Download
            </Button>
          </div>
        )
      },
    },
  ]
}

export { getReportColumns }
