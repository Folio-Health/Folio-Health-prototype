"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { HeartPulseIcon, BedDoubleIcon, CheckCircle2Icon, ActivityIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { useIcuPatients, useWardsAndBeds, type IcuPatientRow } from "../hooks/use-admissions"
import { useRecentVitals } from "@/features/vitals/hooks/use-vitals"
import type { ICUStatus } from "@/lib/mock/admissions"

const STATUS_TONE: Record<ICUStatus, "red" | "green" | "blue"> = {
  Critical: "red",
  Stable: "green",
  Improving: "blue",
}

function IcuDashboard() {
  const { data: icuPatients = [], isLoading, isError } = useIcuPatients()
  const { data: wardsAndBeds } = useWardsAndBeds()

  // One vitals query for the whole board; the newest reading per patient is
  // picked below. Fetching per row would be a request per bed.
  const { data: recentVitals = [] } = useRecentVitals({ limit: 200 })
  const latestVitalsByPatient = useMemo(() => {
    const map = new Map<string, (typeof recentVitals)[number]>()
    // useRecentVitals returns newest first, so the first sighting wins.
    for (const reading of recentVitals) {
      if (!map.has(reading.patientId)) map.set(reading.patientId, reading)
    }
    return map
  }, [recentVitals])

  const icuWard = (wardsAndBeds?.wards ?? []).find((w) =>
    /icu|intensive/i.test(w.department || w.name)
  )
  const icuBeds = icuWard
    ? (wardsAndBeds?.beds ?? []).filter((b) => b.wardId === icuWard.id)
    : []
  const availableIcuBeds = icuBeds.filter((b) => b.status === "Available").length
  const ventilatorCount = icuPatients.filter((p) => p.onVentilator).length
  const ventilatorUsagePct = icuBeds.length
    ? Math.round((ventilatorCount / icuBeds.length) * 100)
    : 0

  const columns: ColumnDef<IcuPatientRow>[] = useMemo(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => {
          const label = row.original.patientName ?? "Patient"
          return (
            <div className="flex items-center gap-2.5">
              <PersonAvatar name={label} seed={row.original.patientId} size="sm" />
              <span className="font-medium text-foreground">{label}</span>
            </div>
          )
        },
      },
      {
        id: "bed",
        header: "Bed",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.bedLabel ?? "Unassigned"}</span>
        ),
      },
      {
        id: "doctor",
        header: "Attending Doctor",
        // Practitioner names are not resolved on this query; the encounter id
        // is a truthful pointer, unlike a fabricated name.
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.admissionId ? `Encounter/${row.original.admissionId}` : "Unassigned"}
          </span>
        ),
      },
      {
        id: "vitals",
        header: "Vitals",
        cell: ({ row }) => {
          const reading = latestVitalsByPatient.get(row.original.patientId)
          // No recorded observations means exactly that. Showing zeros would
          // read as a patient with no pulse.
          if (!reading) {
            return <span className="text-xs text-muted-foreground">No vitals recorded</span>
          }
          return (
            <span className="text-xs tabular-nums text-muted-foreground">
              HR {reading.pulse} &middot; BP {reading.bpSystolic}/{reading.bpDiastolic} &middot;
              SpO2 {reading.spo2}% &middot; {reading.temperature}°C
            </span>
          )
        },
      },
      {
        id: "ventilator",
        header: "Ventilator",
        cell: ({ row }) =>
          row.original.onVentilator ? (
            <StatusBadge status="On Ventilator" tone="red" />
          ) : (
            <span className="text-xs text-muted-foreground">Off</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} tone={STATUS_TONE[row.original.status]} />
        ),
      },
    ],
    [latestVitalsByPatient]
  )

  return (
    <div>
      <PageHeader
        title="ICU Dashboard"
        description={icuWard ? `${icuWard.name} · ${icuWard.department}` : "Intensive care overview"}
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "ICU Dashboard" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ICU Beds" value={icuBeds.length} icon={BedDoubleIcon} />
        <StatCard label="Occupied" value={icuPatients.length} icon={HeartPulseIcon} tone="red" />
        <StatCard label="Available" value={availableIcuBeds} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Ventilator Usage" value={`${ventilatorUsagePct}%`} icon={ActivityIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={icuPatients}
        isLoading={isLoading}
        emptyTitle={isError ? "Could not load ICU patients" : "No ICU patients"}
        emptyDescription={
          isError
            ? "Check your connection and try again."
            : icuWard
              ? "Patients currently admitted to the ICU will appear here."
              : "No ICU ward exists yet. Create one in Ward Management to use this board."
        }
      />
    </div>
  )
}

export { IcuDashboard }
