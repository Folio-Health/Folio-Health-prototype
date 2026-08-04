"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DoorOpenIcon, ClipboardCheckIcon, ClipboardListIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { getPatientById } from "@/lib/mock/patients"
import { getPendingDischarges } from "@/lib/mock/admissions"
import type { Admission } from "@/lib/mock/admissions"
import { dischargeColumns } from "./discharge-columns"

function DischargeQueue() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Admission | null>(null)

  const queue = useMemo(
    () => getPendingDischarges().filter((a) => !completedIds.has(a.id)),
    [completedIds]
  )

  const summaryReadyCount = queue.filter((a) => a.dischargeSummaryReady).length

  function confirmComplete() {
    if (!pending) return
    setCompletedIds((prev) => new Set(prev).add(pending.id))
    const patient = getPatientById(pending.patientId)
    toast.success(`${patient?.name ?? "Patient"} discharged`, {
      description: "Discharge completed and bed released.",
    })
    setPending(null)
  }

  function handlePrint(admission: Admission) {
    const patient = getPatientById(admission.patientId)
    toast.success("Sending discharge summary to printer...", {
      description: patient?.name,
    })
  }

  const columns = useMemo(() => dischargeColumns((a) => setPending(a), handlePrint), [])

  return (
    <div>
      <PageHeader
        title="Discharge Queue"
        description="Patients marked ready for discharge"
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Discharge Queue" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ready for Discharge" value={queue.length} icon={DoorOpenIcon} tone="amber" />
        <StatCard label="Summary Completed" value={summaryReadyCount} icon={ClipboardCheckIcon} tone="emerald" />
        <StatCard
          label="Summary Pending"
          value={queue.length - summaryReadyCount}
          icon={ClipboardListIcon}
          tone="violet"
        />
      </div>

      <DataTable
        columns={columns}
        data={queue}
        emptyTitle="No patients pending discharge"
        emptyDescription="Patients marked ready for discharge by their care team will appear here."
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Complete discharge?"
        description={
          pending
            ? `This will finalize the discharge for ${getPatientById(pending.patientId)?.name ?? "this patient"} and release their bed.`
            : ""
        }
        confirmLabel="Complete Discharge"
        destructive={false}
        onConfirm={confirmComplete}
      />
    </div>
  )
}

export { DischargeQueue }
