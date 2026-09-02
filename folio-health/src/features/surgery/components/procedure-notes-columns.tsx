"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { EyeIcon } from "lucide-react"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { ProcedureNote } from "@/lib/mock/surgery"

function procedureNotesColumns(onView: (note: ProcedureNote) => void): ColumnDef<ProcedureNote>[] {
  return [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const note = row.original as ProcedureNote & { patientName?: string }
        const label = note.patientName ?? "Patient"
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={label} seed={note.surgeryId} size="sm" />
            <span className="font-medium text-foreground">{label}</span>
          </div>
        )
      },
    },
    {
      id: "procedure",
      header: "Procedure",
      cell: ({ row }) => {
        const note = row.original as ProcedureNote & { procedureName?: string }
        return <span className="text-foreground">{note.procedureName ?? "Procedure"}</span>
      },
    },
    {
      id: "surgeon",
      header: "Surgeon",
      cell: ({ row }) => {
        const note = row.original as ProcedureNote & { surgeonId?: string }
        return (
          <span className="text-muted-foreground">
            {note.surgeonId ? `Practitioner/${note.surgeonId}` : "Unassigned"}
          </span>
        )
      },
    },
    {
      id: "notes",
      header: "Procedure Notes",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-64 text-muted-foreground">{row.original.findings}</span>
      ),
    },
    {
      id: "outcome",
      header: "Complications",
      // Recovery outcome has no FHIR home in this app yet, so the column
      // reports what the note DOES record: whether complications occurred.
      // A recovery status here would be invented.
      cell: ({ row }) =>
        row.original.complications ? (
          <StatusBadge status="Complications" tone="amber" />
        ) : (
          <StatusBadge status="None recorded" />
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{format(new Date(row.original.createdAt), "MMM d, yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            onView(row.original)
          }}
        >
          <EyeIcon className="size-4" />
        </Button>
      ),
    },
  ]
}

export { procedureNotesColumns }
