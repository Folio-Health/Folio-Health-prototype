"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { FileTextIcon, DropletsIcon, TriangleAlertIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { ProcedureNote } from "@/lib/mock/surgery"
import { useProcedureNotes, type ProcedureNoteWithContext } from "../hooks/use-surgery"
import { procedureNotesColumns } from "./procedure-notes-columns"

function ProcedureNotes() {
  const [viewing, setViewing] = useState<ProcedureNote | null>(null)

  const { data: notes = [], isLoading, isError } = useProcedureNotes()

  const rows = useMemo(
    () => [...notes].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [notes]
  )

  const totalBloodLoss = rows.reduce((sum, n) => sum + n.bloodLossMl, 0)
  // An empty complications field means none were recorded, so it counts as
  // no complication rather than as an unknown.
  const withComplications = rows.filter(
    (n) => n.complications && n.complications !== "None"
  ).length

  const columns = useMemo(() => procedureNotesColumns((n) => setViewing(n)), [])

  const viewingContext = viewing as ProcedureNoteWithContext | null
  const viewingSurgery = viewingContext ? { procedure: viewingContext.procedureName } : undefined
  const viewingPatient = viewingContext?.patientName
    ? { name: viewingContext.patientName }
    : undefined
  const viewingSurgeon = viewingContext?.surgeonId
    ? { name: `Practitioner/${viewingContext.surgeonId}` }
    : undefined

  return (
    <div>
      <PageHeader
        title="Procedure Notes"
        description={`${rows.length} completed or in-progress procedure records`}
        breadcrumbs={[{ label: "Surgery" }, { label: "Procedure Notes" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Procedure Records" value={rows.length} icon={FileTextIcon} />
        <StatCard label="Avg. Blood Loss" value={`${Math.round(totalBloodLoss / (rows.length || 1))} mL`} icon={DropletsIcon} tone="red" />
        <StatCard label="With Complications" value={withComplications} icon={TriangleAlertIcon} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onRowClick={(note) => setViewing(note)}
        emptyTitle={isError ? "Could not load notes" : "No procedure notes yet"}
        emptyDescription="Notes for completed and in-progress procedures will appear here."
      />

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingSurgery?.procedure}</DialogTitle>
            <DialogDescription>
              {viewingPatient?.name} &middot; {viewingSurgeon?.name} &middot;{" "}
              {viewing && format(new Date(viewing.createdAt), "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="mb-1 font-medium text-foreground">Procedure Details</p>
              <p className="text-muted-foreground">{viewing?.procedureDetails}</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-foreground">Findings</p>
              <p className="text-muted-foreground">{viewing?.findings}</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-foreground">Complications</p>
              <p className="text-muted-foreground">{viewing?.complications}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated Blood Loss</span>
              <span className="tabular-nums text-foreground">{viewing?.bloodLossMl} mL</span>
            </div>
            {/*
              Recovery outcome is not shown. Post-operative recovery notes have
              no FHIR resource in this app yet, and rendering a placeholder
              status would assert a recovery nobody recorded.
            */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ProcedureNotes }
