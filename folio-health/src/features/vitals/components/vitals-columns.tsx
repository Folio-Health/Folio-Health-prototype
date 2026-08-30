"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ActivityIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { VitalReading } from "@/types/core"

function vitalsAlertLevel(reading: VitalReading): "Critical" | "Abnormal" | "Normal" {
  if (reading.spo2 < 92 || reading.bpSystolic >= 160 || reading.bpDiastolic >= 100) {
    return "Critical"
  }
  if (reading.spo2 < 95 || reading.bpSystolic >= 140 || reading.bpDiastolic >= 90) {
    return "Abnormal"
  }
  return "Normal"
}

export const vitalsColumns: ColumnDef<VitalReading>[] = [
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const { patientId, patientName } = row.original
      // The reading is real even when the name lookup is not available, so the
      // row still links to the patient rather than being dropped or faked.
      const label = patientName ?? "View patient"
      return (
        <Link
          href={`/patients/${patientId}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <PersonAvatar name={label} seed={patientId} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {label}
            </span>
          </div>
        </Link>
      )
    },
  },
  {
    id: "bp",
    header: "Blood Pressure",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.bpSystolic}/{row.original.bpDiastolic}{" "}
        <span className="text-xs text-muted-foreground">mmHg</span>
      </span>
    ),
  },
  {
    accessorKey: "pulse",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pulse" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.pulse} <span className="text-xs text-muted-foreground">bpm</span></span>
    ),
  },
  {
    accessorKey: "temperature",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Temp" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.temperature}°C</span>
    ),
  },
  {
    accessorKey: "spo2",
    header: ({ column }) => <DataTableColumnHeader column={column} title="SpO2" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.spo2}%</span>,
  },
  {
    id: "alert",
    header: "Status",
    cell: ({ row }) => {
      const level = vitalsAlertLevel(row.original)
      return <StatusBadge status={level} tone={level === "Normal" ? "green" : level === "Abnormal" ? "amber" : "red"} />
    },
  },
  {
    accessorKey: "recordedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recorded At" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.recordedAt), "MMM d, yyyy h:mm a")}
      </span>
    ),
  },
  {
    accessorKey: "recordedBy",
    header: "Recorded By",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.recordedBy}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        render={<Link href={`/patients/${row.original.patientId}`} />}
        onClick={(e) => e.stopPropagation()}
      >
        <ActivityIcon className="size-3.5" />
        View Trend
      </Button>
    ),
  },
]
