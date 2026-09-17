"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { EyeIcon } from "lucide-react"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { getSurgeryById, getPostOpNoteForSurgery } from "@/lib/mock/surgery"
import type { ProcedureNote, RecoveryStatus } from "@/lib/mock/surgery"

const RECOVERY_TONE: Record<RecoveryStatus, "green" | "amber" | "red"> = {
  Stable: "green",
  Guarded: "amber",
  Critical: "red",
}

function procedureNotesColumns(onView: (note: ProcedureNote) => void): ColumnDef<ProcedureNote>[] {
  return [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const surgery = getSurgeryById(row.original.surgeryId)
        const patient = surgery ? getPatientById(surgery.patientId) : undefined
        if (!patient) return <span className="text-muted-foreground">Unknown patient</span>
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground">{patient.mrn}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "procedure",
      header: "Procedure",
      cell: ({ row }) => {
        const surgery = getSurgeryById(row.original.surgeryId)
        return <span className="text-foreground">{surgery?.procedure ?? "N/A"}</span>
      },
    },
    {
      id: "surgeon",
      header: "Surgeon",
      cell: ({ row }) => {
        const surgery = getSurgeryById(row.original.surgeryId)
        const surgeon = surgery ? getStaffById(surgery.surgeonId) : undefined
        return <span className="text-muted-foreground">{surgeon?.name ?? "Unassigned"}</span>
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
      header: "Outcome",
      cell: ({ row }) => {
        const postOp = getPostOpNoteForSurgery(row.original.surgeryId)
        if (!postOp) return <StatusBadge status="In Progress" />
        return <StatusBadge status={postOp.recoveryStatus} tone={RECOVERY_TONE[postOp.recoveryStatus]} />
      },
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
