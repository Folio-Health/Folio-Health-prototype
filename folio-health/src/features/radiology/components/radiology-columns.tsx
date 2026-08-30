"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, FileTextIcon, PrinterIcon } from "lucide-react"
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
import type { ImagingRequest } from "@/lib/mock/radiology"

function getRadiologyColumns({ onPrint }: { onPrint: (request: ImagingRequest) => void }): ColumnDef<ImagingRequest>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Study ID" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const { patientId, patientName } = row.original as ImagingRequest & {
          patientName?: string
        }
        // The exam is real even when the name include is unavailable, so the
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
      accessorKey: "modality",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modality" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-foreground">{row.original.modality}</span>
          <span className="text-xs text-muted-foreground">{row.original.bodyPart}</span>
        </div>
      ),
    },
    {
      id: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => {
        const { doctorId } = row.original
        // Practitioner display names are not included on this query; the
        // reference is shown rather than a fabricated name.
        return (
          <span className="text-muted-foreground">
            {doctorId ? `Practitioner/${doctorId}` : "Unassigned"}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
        const request = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/radiology/${request.id}`} />}>
                <EyeIcon />
                View Study
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/radiology/${request.id}`} />}>
                <FileTextIcon />
                View Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint(request)}>
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

export { getRadiologyColumns }
