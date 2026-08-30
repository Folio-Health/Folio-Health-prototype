"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ActivityIcon,
  HeartPulseIcon,
  PlusIcon,
  TriangleAlertIcon,
  WavesIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { vitalsColumns } from "./vitals-columns"
import { VitalsEntryForm, type VitalsFormValues } from "./vitals-entry-form"
import { useRecentVitals, useRecordVitals } from "../hooks/use-vitals"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import type { VitalReading } from "@/types/core"

function VitalsHub() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: readings = [], isLoading, isError, error } = useRecentVitals({ limit: 60 })
  const recordVitals = useRecordVitals()
  const { data: user } = useCurrentUser()
  // The picker needs real patients to record against; the hub itself does not
  // depend on this query, so a slow patient list never blocks the table.
  const { data: patientData } = usePatients({}, dialogOpen)

  const stats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const recordingsToday = readings.filter((r) => r.recordedAt.slice(0, 10) === todayKey).length

    const latestPerPatient = new Map<string, VitalReading>()
    for (const r of readings) {
      const existing = latestPerPatient.get(r.patientId)
      if (!existing || r.recordedAt > existing.recordedAt) latestPerPatient.set(r.patientId, r)
    }
    const alerts = [...latestPerPatient.values()].filter(
      (r) => r.spo2 < 95 || r.bpSystolic >= 140 || r.bpDiastolic >= 90
    ).length

    const sample = readings.slice(0, 40)
    const avgSystolic = sample.length
      ? Math.round(sample.reduce((sum, r) => sum + r.bpSystolic, 0) / sample.length)
      : 0
    const avgDiastolic = sample.length
      ? Math.round(sample.reduce((sum, r) => sum + r.bpDiastolic, 0) / sample.length)
      : 0
    const avgSpo2 = sample.length
      ? Math.round((sample.reduce((sum, r) => sum + r.spo2, 0) / sample.length) * 10) / 10
      : 0

    return { recordingsToday, alerts, avgBp: `${avgSystolic}/${avgDiastolic}`, avgSpo2 }
  }, [readings])

  async function handleSubmit(values: VitalsFormValues) {
    try {
      await recordVitals.mutateAsync({
        ...values,
        // Attributes the reading to the signed-in clinician rather than to
        // whichever nurse the mock layer happened to return first.
        performer:
          user?.id && user.resourceType === "Practitioner"
            ? { reference: `Practitioner/${user.id}`, display: user.name }
            : undefined,
      })
      setDialogOpen(false)
      toast.success("Vitals recorded")
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error ? mutationError.message : "Could not record the vitals"
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="Vitals"
        description="Cross patient vital sign recordings and trends"
        breadcrumbs={[{ label: "Clinical" }, { label: "Vitals" }]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <PlusIcon />
              Record Vitals
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Vitals</DialogTitle>
                <DialogDescription>Capture a new vital sign reading for a patient.</DialogDescription>
              </DialogHeader>
              <VitalsEntryForm
                patients={patientData?.patients ?? []}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recordings Today" value={stats.recordingsToday} icon={ActivityIcon} />
        <StatCard
          label="Patients with Alerts"
          value={stats.alerts}
          icon={TriangleAlertIcon}
          tone="amber"
        />
        <StatCard label="Avg. Blood Pressure" value={stats.avgBp} icon={HeartPulseIcon} tone="violet" />
        <StatCard label="Avg. SpO2" value={`${stats.avgSpo2}%`} icon={WavesIcon} tone="cyan" />
      </div>

      <DataTable
        columns={vitalsColumns}
        data={readings}
        isLoading={isLoading}
        emptyTitle={isError ? "Could not load vitals" : "No vitals recorded"}
        emptyDescription={
          isError
            ? error instanceof Error
              ? error.message
              : "Check your connection and try again."
            : "Recordings will appear here as they're captured across the hospital."
        }
      />
    </div>
  )
}

export { VitalsHub }
