"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ListOrderedIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/common/empty-state"
import { cn } from "@/lib/utils"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { ER_CASES_LIST, TRIAGE_LEVELS, triageMeta } from "@/lib/mock/emergency"
import type { TriageLevel } from "@/lib/mock/emergency"

function TriageQueue() {
  const [overrides, setOverrides] = useState<Record<string, TriageLevel>>({})

  const cases = useMemo(() => {
    return ER_CASES_LIST.filter((c) => c.status === "Waiting" || c.status === "In Treatment")
      .map((c) => ({ ...c, triageLevel: overrides[c.id] ?? c.triageLevel }))
      .sort((a, b) => a.triageLevel - b.triageLevel || +new Date(a.arrivalTime) - +new Date(b.arrivalTime))
  }, [overrides])

  function reassign(caseId: string, level: TriageLevel) {
    setOverrides((prev) => ({ ...prev, [caseId]: level }))
    const patient = getPatientById(ER_CASES_LIST.find((c) => c.id === caseId)?.patientId ?? "")
    toast.success(`Triage level updated`, {
      description: `${patient?.name ?? "Patient"} reassigned to ${triageMeta(level).label}.`,
    })
  }

  return (
    <div>
      <PageHeader
        title="Triage Queue"
        description="Waiting and in-treatment cases, ordered by acuity"
        breadcrumbs={[{ label: "Emergency", href: "/emergency" }, { label: "Triage Queue" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {TRIAGE_LEVELS.map((t) => (
          <StatCard
            key={t.level}
            label={t.label}
            value={cases.filter((c) => c.triageLevel === t.level).length}
            icon={ListOrderedIcon}
            tone={t.level <= 2 ? "red" : t.level === 3 ? "amber" : "primary"}
          />
        ))}
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={ListOrderedIcon}
          title="Queue is empty"
          description="No patients are currently waiting or in treatment."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((c) => {
            const patient = getPatientById(c.patientId)
            const doctor = getStaffById(c.assignedDoctorId)
            const meta = triageMeta(c.triageLevel)
            return (
              <Card key={c.id} className={cn("border-l-4 py-0", meta.colorClass.split(" ").find((cl) => cl.startsWith("border-")))}>
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  <PersonAvatar name={patient?.name ?? "Unknown"} seed={patient?.avatarSeed} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-foreground">{patient?.name ?? "Unknown patient"}</span>
                    <span className="truncate text-sm text-muted-foreground">{c.chiefComplaint}</span>
                  </div>
                  <div className="flex flex-col text-xs text-muted-foreground">
                    <span>Arrived {formatDistanceToNow(new Date(c.arrivalTime), { addSuffix: true })}</span>
                    <span>Doctor: {doctor?.name ?? "Unassigned"}</span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium",
                      meta.colorClass
                    )}
                  >
                    {meta.label}
                  </span>
                  <Select
                    value={String(c.triageLevel)}
                    onValueChange={(v) => v && reassign(c.id, Number(v) as TriageLevel)}
                  >
                    <SelectTrigger className="h-9 w-44 shrink-0">
                      <SelectValue placeholder="Reassign level" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIAGE_LEVELS.map((t) => (
                        <SelectItem key={t.level} value={String(t.level)}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { TriageQueue }
