"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckIcon, ClipboardCheckIcon, XIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import {
  SURGERIES_LIST,
  PRE_OP_CHECKLIST_ITEMS,
  getChecklistForSurgery,
  checklistCompletion,
} from "@/lib/mock/surgery"
import type { Surgery } from "@/lib/mock/surgery"

function PreOpChecklistPage() {
  const [viewing, setViewing] = useState<Surgery | null>(null)

  const upcoming = useMemo(
    () =>
      SURGERIES_LIST.filter((s) => s.status === "Scheduled" || s.status === "In Progress").sort(
        (a, b) => +new Date(a.scheduledTime) - +new Date(b.scheduledTime)
      ),
    []
  )

  const readyCount = upcoming.filter((s) => checklistCompletion(getChecklistForSurgery(s.id)) === 100).length
  const incompleteCount = upcoming.length - readyCount

  const columns: ColumnDef<Surgery>[] = useMemo(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => {
          const patient = getPatientById(row.original.patientId)
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
        accessorKey: "procedure",
        header: "Procedure",
        cell: ({ row }) => <span className="text-foreground">{row.original.procedure}</span>,
      },
      {
        id: "surgeon",
        header: "Surgeon",
        cell: ({ row }) => {
          const surgeon = getStaffById(row.original.surgeonId)
          return <span className="text-muted-foreground">{surgeon?.name ?? "Unassigned"}</span>
        },
      },
      {
        accessorKey: "scheduledTime",
        header: "Scheduled Time",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {format(new Date(row.original.scheduledTime), "MMM d, h:mm a")}
          </span>
        ),
      },
      {
        id: "checklist",
        header: "Checklist",
        cell: ({ row }) => {
          const pct = checklistCompletion(getChecklistForSurgery(row.original.id))
          return (
            <div className="flex w-32 items-center gap-2">
              <Progress value={pct} className="flex-1 gap-0">
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
              <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </div>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const pct = checklistCompletion(getChecklistForSurgery(row.original.id))
          return pct === 100 ? (
            <StatusBadge status="Ready" tone="green" />
          ) : (
            <StatusBadge status="Incomplete" tone="amber" />
          )
        },
      },
    ],
    []
  )

  const viewingChecklist = viewing ? getChecklistForSurgery(viewing.id) : undefined
  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined

  return (
    <div>
      <PageHeader
        title="Pre Op Checklist"
        description="Readiness checks for upcoming procedures"
        breadcrumbs={[{ label: "Surgery" }, { label: "Pre Op Checklist" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming Surgeries" value={upcoming.length} icon={ClipboardCheckIcon} />
        <StatCard label="Fully Ready" value={readyCount} icon={CheckIcon} tone="emerald" />
        <StatCard label="Incomplete" value={incompleteCount} icon={XIcon} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        data={upcoming}
        onRowClick={(surgery) => setViewing(surgery)}
        emptyTitle="No upcoming surgeries"
        emptyDescription="Scheduled and in progress procedures will appear here for pre op readiness checks."
      />

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.procedure}</DialogTitle>
            <DialogDescription>
              {viewingPatient?.name} &middot; {viewing && format(new Date(viewing.scheduledTime), "MMM d, h:mm a")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2.5">
            {PRE_OP_CHECKLIST_ITEMS.map((item) => {
              const done = viewingChecklist?.items[item.key] ?? false
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm text-foreground">{item.label}</span>
                  {done ? (
                    <StatusBadge status="Done" tone="green" />
                  ) : (
                    <StatusBadge status="Pending" />
                  )}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PreOpChecklistPage }
