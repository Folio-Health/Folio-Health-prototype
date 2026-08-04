"use client"

import { useMemo, useState } from "react"
import { RulerIcon, WeightIcon, TrendingUpIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/cards/stat-card"
import { EmptyState } from "@/components/common/empty-state"
import { PersonAvatar } from "@/components/common/person-avatar"
import { TrendChart } from "@/components/charts/trend-chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PediatricsModuleTabs } from "./pediatrics-module-tabs"
import { PEDIATRIC_PATIENTS, getGrowthRecordsForPatient, getLatestGrowthRecord } from "@/lib/mock/pediatrics"

function formatAge(months: number): string {
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (years === 0) return `${remMonths}m`
  return remMonths === 0 ? `${years}y` : `${years}y ${remMonths}m`
}

function GrowthCharts() {
  const [patientId, setPatientId] = useState(PEDIATRIC_PATIENTS[0]?.id ?? "")
  const patient = PEDIATRIC_PATIENTS.find((p) => p.id === patientId)

  const records = useMemo(() => getGrowthRecordsForPatient(patientId), [patientId])
  const latest = getLatestGrowthRecord(patientId)

  const chartData = records.map((r) => ({
    age: formatAge(r.ageMonths),
    height: r.heightCm,
    weight: r.weightKg,
  }))

  return (
    <div>
      <PageHeader
        title="Growth Charts"
        description="Height and weight trends against age for pediatric patients"
        breadcrumbs={[{ label: "Clinical" }, { label: "Pediatrics", href: "/pediatrics" }, { label: "Growth Charts" }]}
      />

      <PediatricsModuleTabs />

      {PEDIATRIC_PATIENTS.length === 0 ? (
        <EmptyState title="No pediatric patients" description="No patients under 18 are currently registered." />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {patient && <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />}
            <Select value={patientId} onValueChange={(v) => v && setPatientId(v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {PEDIATRIC_PATIENTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} &middot; {p.age} yrs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Current Height"
              value={latest ? `${latest.heightCm} cm` : "N/A"}
              icon={RulerIcon}
            />
            <StatCard
              label="Current Weight"
              value={latest ? `${latest.weightKg} kg` : "N/A"}
              icon={WeightIcon}
            />
            <StatCard
              label="Height Percentile"
              value={latest ? `${latest.heightPercentile}th` : "N/A"}
              icon={TrendingUpIcon}
              tone="violet"
            />
          </div>

          {chartData.length > 1 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Height Over Time</CardTitle>
                  <CardDescription>Centimeters by age</CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendChart
                    data={chartData}
                    xKey="age"
                    type="line"
                    series={[{ key: "height", label: "Height (cm)", color: "var(--chart-1)" }]}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Weight Over Time</CardTitle>
                  <CardDescription>Kilograms by age</CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendChart
                    data={chartData}
                    xKey="age"
                    type="line"
                    series={[{ key: "weight", label: "Weight (kg)", color: "var(--chart-2)" }]}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="Not enough data"
              description="At least two growth measurements are needed to chart a trend for this patient."
            />
          )}
        </div>
      )}
    </div>
  )
}

export { GrowthCharts }
