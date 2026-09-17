"use client"

import { useMemo } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { TriangleAlertIcon, HeartPulseIcon, ActivityIcon, ThermometerIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { getCriticalCases, triageMeta } from "@/lib/mock/emergency"

function VitalTile({ icon: Icon, label, value }: { icon: typeof HeartPulseIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
      </div>
    </div>
  )
}

function CriticalPatients() {
  const cases = useMemo(
    () => [...getCriticalCases()].sort((a, b) => a.triageLevel - b.triageLevel),
    []
  )

  return (
    <div>
      <PageHeader
        title="Critical Patients"
        description="Level 1 and Level 2 acuity cases currently in the ER"
        breadcrumbs={[{ label: "Emergency", href: "/emergency" }, { label: "Critical Patients" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Critical Cases" value={cases.length} icon={TriangleAlertIcon} tone="red" />
        <StatCard
          label="On Trauma Protocol"
          value={cases.filter((c) => c.isTrauma).length}
          icon={ActivityIcon}
          tone="amber"
        />
        <StatCard
          label="Awaiting Treatment"
          value={cases.filter((c) => c.status === "Waiting").length}
          icon={HeartPulseIcon}
          tone="violet"
        />
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={TriangleAlertIcon}
          title="No critical patients"
          description="Level 1 and Level 2 cases will appear here as they arrive."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cases.map((c) => {
            const patient = getPatientById(c.patientId)
            const doctor = getStaffById(c.assignedDoctorId)
            const meta = triageMeta(c.triageLevel)
            return (
              <Card key={c.id} className="border-red-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar name={patient?.name ?? "Unknown"} seed={patient?.avatarSeed} size="sm" />
                      <div className="flex flex-col">
                        <Link
                          href={patient ? `/patients/${patient.id}` : "#"}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {patient?.name ?? "Unknown patient"}
                        </Link>
                        <span className="text-xs text-muted-foreground">{patient?.mrn}</span>
                      </div>
                    </div>
                    <StatusBadge status={meta.badgeLabel} tone="red" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-foreground">{c.chiefComplaint}</p>
                  <div className="grid grid-cols-3 gap-y-2 rounded-lg bg-muted/40 p-3">
                    <VitalTile icon={HeartPulseIcon} label="HR" value={`${c.vitals.hr} bpm`} />
                    <VitalTile icon={ActivityIcon} label="BP" value={c.vitals.bp} />
                    <VitalTile icon={ThermometerIcon} label="SpO2" value={`${c.vitals.spo2}%`} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Arrived {formatDistanceToNow(new Date(c.arrivalTime), { addSuffix: true })}</span>
                    <span>{doctor?.name ?? "Unassigned"}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { CriticalPatients }
