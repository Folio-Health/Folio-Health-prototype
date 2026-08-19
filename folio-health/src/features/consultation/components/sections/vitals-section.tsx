"use client"

import { useState } from "react"
import { format } from "date-fns"
import { PlusIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { RoleGate } from "@/components/common/role-gate"
import { VitalsEntryForm, type VitalsFormValues } from "@/features/vitals/components/vitals-entry-form"
import type { Patient } from "@/types/core"
import type { VitalReading } from "@/types/core"

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">
        {value} <span className="font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}

function VitalsSection({
  patient,
  latestVitals,
  onRecord,
}: {
  patient: Patient
  latestVitals?: VitalReading
  onRecord: (values: VitalsFormValues) => void
}) {
  const [showForm, setShowForm] = useState(false)

  function handleSubmit(values: VitalsFormValues) {
    onRecord(values)
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Latest Vitals</CardTitle>
          <CardDescription>
            {latestVitals
              ? `Recorded ${format(new Date(latestVitals.recordedAt), "MMM d, yyyy h:mm a")} by ${latestVitals.recordedBy}`
              : "No readings recorded yet for this patient"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestVitals ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Metric
                label="Blood Pressure"
                value={`${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`}
                unit="mmHg"
              />
              <Metric label="Heart Rate" value={String(latestVitals.pulse)} unit="bpm" />
              <Metric label="Temperature" value={String(latestVitals.temperature)} unit="°C" />
              <Metric label="Resp. Rate" value={String(latestVitals.respiratoryRate)} unit="/min" />
              <Metric label="SpO2" value={String(latestVitals.spo2)} unit="%" />
              <Metric label="Weight" value={String(latestVitals.weight)} unit="kg" />
              <Metric label="Height" value={String(latestVitals.height)} unit="cm" />
              <Metric label="BMI" value={String(latestVitals.bmi)} unit="" />
            </div>
          ) : (
            <EmptyState title="No vitals yet" description="Record vitals for this visit to see them here." />
          )}
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Record New Vitals</CardTitle>
            <CardDescription>Captured for this visit &middot; {patient.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <VitalsEntryForm
              lockedPatient={patient}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              submitLabel="Save Vitals"
            />
          </CardContent>
        </Card>
      ) : (
        <RoleGate roles={["doctor", "nurse"]}>
          <Button variant="outline" className="self-start" onClick={() => setShowForm(true)}>
            <PlusIcon />
            Record New Vitals
          </Button>
        </RoleGate>
      )}
    </div>
  )
}

export { VitalsSection }
