"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DoorOpenIcon, ClipboardCheckIcon, ClipboardListIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { RoleGate } from "@/components/common/role-gate"
import { useAdmissions, useDischargePatient } from "../hooks/use-admissions"
import type { AdmissionWithPatient } from "../hooks/use-admissions"
import type { Admission } from "@/lib/mock/admissions"
import { dischargeColumns } from "./discharge-columns"

function DischargeQueue() {
  const [pending, setPending] = useState<Admission | null>(null)

  const { data: admissions = [], isLoading, isError } = useAdmissions(false)
  const dischargePatient = useDischargePatient()

  // Only those a clinician has actually marked ready. The flag is persisted on
  // the Encounter (see READY_FOR_DISCHARGE_EXTENSION_URL); before it existed
  // this list was fabricated.
  const queue = useMemo(() => admissions.filter((a) => a.readyForDischarge), [admissions])

  // Whether the discharge SUMMARY document exists is a DocumentReference
  // question this app does not answer yet, so the figure is not invented.
  const summaryReadyCount = queue.filter((a) => a.dischargeSummaryReady).length

  async function confirmComplete() {
    if (!pending) return
    try {
      await dischargePatient.mutateAsync(pending.id)
      toast.success("Patient discharged", {
        description: "The admission is closed and the bed is free again.",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete the discharge")
    } finally {
      setPending(null)
    }
  }

  function handlePrint(admission: Admission) {
    toast.success("Sending discharge summary to printer...", {
      description: (admission as AdmissionWithPatient).patientName,
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
        isLoading={isLoading}
        emptyTitle={isError ? "Could not load the queue" : "No patients pending discharge"}
        emptyDescription="Patients marked ready for discharge by their care team will appear here."
      />

      <RoleGate roles={["doctor", "nurse"]}>
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(open) => !open && setPending(null)}
          title="Complete discharge?"
          description={
            pending
              ? `This will finalize the discharge for ${(pending as AdmissionWithPatient).patientName ?? "this patient"} and release their bed.`
              : ""
          }
          confirmLabel="Complete Discharge"
          destructive={false}
          onConfirm={confirmComplete}
        />
      </RoleGate>
    </div>
  )
}

export { DischargeQueue }
