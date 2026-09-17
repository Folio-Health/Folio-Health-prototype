"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { HeartPulseIcon, BedDoubleIcon, CheckCircle2Icon, ActivityIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import {
  WARDS_LIST,
  BEDS_LIST,
  getBedById,
  getAdmissionById,
  ICU_PATIENTS_LIST,
} from "@/lib/mock/admissions"
import type { ICUPatient, ICUStatus } from "@/lib/mock/admissions"

const STATUS_TONE: Record<ICUStatus, "red" | "green" | "blue"> = {
  Critical: "red",
  Stable: "green",
  Improving: "blue",
}

function IcuDashboard() {
  const icuWard = WARDS_LIST.find((w) => w.name === "ICU")
  const icuBeds = icuWard ? BEDS_LIST.filter((b) => b.wardId === icuWard.id) : []
  const availableIcuBeds = icuBeds.filter((b) => b.status === "Available").length
  const ventilatorCount = ICU_PATIENTS_LIST.filter((p) => p.onVentilator).length
  const ventilatorUsagePct = icuBeds.length
    ? Math.round((ventilatorCount / icuBeds.length) * 100)
    : 0

  const columns: ColumnDef<ICUPatient>[] = useMemo(
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
        id: "bed",
        header: "Bed",
        cell: ({ row }) => {
          const bed = getBedById(row.original.bedId)
          return <span className="text-muted-foreground">{bed?.label ?? "N/A"}</span>
        },
      },
      {
        id: "doctor",
        header: "Attending Doctor",
        cell: ({ row }) => {
          const admission = getAdmissionById(row.original.admissionId)
          const doctor = admission ? getStaffById(admission.doctorId) : undefined
          return <span className="text-muted-foreground">{doctor?.name ?? "Unassigned"}</span>
        },
      },
      {
        id: "vitals",
        header: "Vitals",
        cell: ({ row }) => {
          const v = row.original.vitals
          return (
            <span className="text-xs tabular-nums text-muted-foreground">
              HR {v.hr} &middot; BP {v.bp} &middot; SpO2 {v.spo2}% &middot; {v.temp}°C
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
    []
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
        <StatCard label="Occupied" value={ICU_PATIENTS_LIST.length} icon={HeartPulseIcon} tone="red" />
        <StatCard label="Available" value={availableIcuBeds} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Ventilator Usage" value={`${ventilatorUsagePct}%`} icon={ActivityIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={ICU_PATIENTS_LIST}
        emptyTitle="No ICU patients"
        emptyDescription="Patients currently admitted to the ICU will appear here."
      />
    </div>
  )
}

export { IcuDashboard }
