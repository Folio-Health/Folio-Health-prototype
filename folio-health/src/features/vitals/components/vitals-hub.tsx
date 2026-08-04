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
import { PATIENTS, getPatientById } from "@/lib/mock/patients"
import { getStaffByRole } from "@/lib/mock/staff"
import { getAllRecentVitals } from "@/lib/mock/vitals"
import type { VitalReading } from "@/types/core"

const SEED_VITALS = getAllRecentVitals(60)

function buildReading(values: VitalsFormValues, recordedBy: string): VitalReading {
  const heightM = values.height / 100
  return {
    id: `VIT-LOCAL-${Date.now()}`,
    patientId: values.patientId,
    recordedAt: new Date().toISOString(),
    recordedBy,
    bpSystolic: values.bpSystolic,
    bpDiastolic: values.bpDiastolic,
    pulse: values.pulse,
    temperature: values.temperature,
    respiratoryRate: values.respiratoryRate,
    spo2: values.spo2,
    weight: values.weight,
    height: values.height,
    bmi: Number((values.weight / (heightM * heightM)).toFixed(1)),
  }
}

function VitalsHub() {
  const [extraReadings, setExtraReadings] = useState<VitalReading[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const readings = useMemo(
    () => [...extraReadings, ...SEED_VITALS].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    [extraReadings]
  )

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

  function handleSubmit(values: VitalsFormValues) {
    const recordedBy = getStaffByRole("Nurse")[0]?.name ?? "Nurse on Duty"
    const reading = buildReading(values, recordedBy)
    setExtraReadings((prev) => [reading, ...prev])
    setDialogOpen(false)
    const patient = getPatientById(values.patientId)
    toast.success(`Vitals recorded for ${patient?.name ?? "patient"}`)
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
                patients={PATIENTS.slice(0, 60)}
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
        emptyTitle="No vitals recorded"
        emptyDescription="Recordings will appear here as they're captured across the hospital."
      />
    </div>
  )
}

export { VitalsHub }
