"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckIcon, ClipboardCheckIcon, XIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { PRE_OP_CHECKLIST_ITEMS } from "@/lib/mock/surgery"
import type { Surgery } from "@/lib/mock/surgery"
import {
  checklistCompletionOf,
  useSaveChecklist,
  useSurgeries,
  type SurgeryWithPatient,
} from "../hooks/use-surgery"

function PreOpChecklistPage() {
  const [viewing, setViewing] = useState<Surgery | null>(null)

  const { data: surgeries = [], isLoading, isError } = useSurgeries()
  const saveChecklist = useSaveChecklist()

  const upcoming = useMemo(
    () =>
      surgeries
        .filter((s) => s.status === "Scheduled" || s.status === "In Progress")
        .sort((a, b) => +new Date(a.scheduledTime) - +new Date(b.scheduledTime)),
    [surgeries]
  )

  const completionOf = (s: Surgery) =>
    checklistCompletionOf((s as SurgeryWithPatient).checklistItems ?? {}, PRE_OP_CHECKLIST_ITEMS.length)

  const readyCount = upcoming.filter((s) => completionOf(s) === 100).length
  const incompleteCount = upcoming.length - readyCount

  const columns: ColumnDef<Surgery>[] = useMemo(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => {
          const patient = { name: (row.original as SurgeryWithPatient).patientName ?? "Patient" }
          return (
            <div className="flex items-center gap-2.5">
              <PersonAvatar name={patient.name} seed={row.original.patientId} size="sm" />
              <span className="font-medium text-foreground">{patient.name}</span>
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
          const surgeon = row.original.surgeonId
            ? { name: `Practitioner/${row.original.surgeonId}` }
            : undefined
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
          const pct = completionOf(row.original)
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
          const pct = completionOf(row.original)
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

  const viewingChecklist = viewing
    ? { surgeryId: viewing.id, items: (viewing as SurgeryWithPatient).checklistItems ?? {} }
    : undefined
  const viewingPatient = viewing
    ? { name: (viewing as SurgeryWithPatient).patientName ?? "Patient" }
    : undefined

  /** Tick or untick one item, persisted to the Procedure. */
  async function toggleChecklistItem(key: string, checked: boolean) {
    if (!viewing) return
    const items = { ...((viewing as SurgeryWithPatient).checklistItems ?? {}), [key]: checked }
    try {
      await saveChecklist.mutateAsync({ surgeryId: viewing.id, items })
      setViewing((current) =>
        current ? ({ ...current, checklistItems: items } as Surgery) : current
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the checklist")
    }
  }

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
                  {/*
                    The badge is now the control: ticking an item writes to the
                    Procedure. Previously it was read-only, so a theatre team
                    could not actually complete a checklist.
                  */}
                  <Button
                    size="sm"
                    variant={done ? "outline" : "default"}
                    disabled={saveChecklist.isPending}
                    onClick={() => toggleChecklistItem(item.key, !done)}
                  >
                    {done ? "Done" : "Mark done"}
                  </Button>
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
