"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { TruckIcon } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { getPatientById } from "@/lib/mock/patients"
import type { AmbulanceDispatch, AmbulanceStatus } from "@/lib/mock/emergency"

const STATUS_TONE: Record<AmbulanceStatus, "amber" | "blue" | "violet" | "green"> = {
  Dispatched: "amber",
  "En Route": "blue",
  Arrived: "violet",
  Available: "green",
}

export const ambulanceColumns: ColumnDef<AmbulanceDispatch>[] = [
  {
    accessorKey: "ambulanceId",
    header: "Ambulance ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <TruckIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{row.original.ambulanceId}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />
    ),
  },
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = row.original.patientId ? getPatientById(row.original.patientId) : undefined
      if (!patient) return <span className="text-muted-foreground">Unassigned</span>
      return (
        <Link
          href={`/patients/${patient.id}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
          <span className="font-medium text-foreground hover:text-primary hover:underline">{patient.name}</span>
        </Link>
      )
    },
  },
  {
    accessorKey: "destination",
    header: "Destination",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.destination}</span>,
  },
  {
    id: "crew",
    header: "Crew",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.crew.join(", ")}</span>
    ),
  },
  {
    accessorKey: "etaMinutes",
    header: "ETA",
    cell: ({ row }) => {
      const { status, etaMinutes } = row.original
      if (status === "Available") return <span className="text-muted-foreground">N/A</span>
      if (status === "Arrived") return <span className="text-foreground">Arrived</span>
      return <span className="tabular-nums text-foreground">{etaMinutes} min</span>
    },
  },
]
