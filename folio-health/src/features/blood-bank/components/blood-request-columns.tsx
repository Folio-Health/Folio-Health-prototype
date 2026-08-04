"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, CheckIcon, XIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge, type StatusTone } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPatientById } from "@/lib/mock/patients"
import type { BloodRequest, RequestStatus } from "@/lib/mock/blood-bank"

const REQUEST_STATUS_TONE: Record<RequestStatus, StatusTone> = {
  Pending: "amber",
  Approved: "blue",
  Fulfilled: "green",
  Rejected: "red",
}

function getBloodRequestColumns({
  onView,
  onApprove,
  onReject,
}: {
  onView: (request: BloodRequest) => void
  onApprove: (request: BloodRequest) => void
  onReject: (request: BloodRequest) => void
}): ColumnDef<BloodRequest>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Request ID" />,
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
      accessorKey: "bloodType",
      header: "Blood Group",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.bloodType}</span>,
    },
    {
      accessorKey: "unitsRequested",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Units Requested" />,
      cell: ({ row }) => <span className="tabular-nums text-foreground">{row.original.unitsRequested}</span>,
    },
    {
      accessorKey: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-foreground">{row.original.requestedBy}</span>
          <span className="text-xs text-muted-foreground">{row.original.department}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} tone={REQUEST_STATUS_TONE[row.original.status]} />,
    },
    {
      accessorKey: "requestedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.requestedAt), "MMM d, yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const request = row.original
        const isPending = request.status === "Pending"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(request)}>
                <EyeIcon />
                View Request
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isPending} onClick={() => onApprove(request)}>
                <CheckIcon />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isPending} variant="destructive" onClick={() => onReject(request)}>
                <XIcon />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { getBloodRequestColumns }
