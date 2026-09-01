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
import { TRIAGE_LEVELS, triageMeta } from "@/lib/mock/emergency"
import { useErCases, useSetTriageLevel, type ErCaseWithPatient } from "../hooks/use-emergency"
import type { TriageLevel } from "@/lib/mock/emergency"

function TriageQueue() {
  const { data: allCases = [] } = useErCases(false)
  const setTriageLevel = useSetTriageLevel()

  // The hook already returns sickest-first, longest-waiting next; this only
  // narrows to the patients still physically in the department.
  const cases = useMemo(
    () => allCases.filter((c) => c.status === "Waiting" || c.status === "In Treatment"),
    [allCases]
  )

  async function reassign(caseId: string, level: TriageLevel) {
    const target = cases.find((c) => c.id === caseId) as ErCaseWithPatient | undefined
    try {
      await setTriageLevel.mutateAsync({ caseId, level })
      toast.success("Triage level updated", {
        description: `${target?.patientName ?? "Patient"} reassigned to ${triageMeta(level).label}.`,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the triage level")
    }
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
            const patientName = c.patientName ?? "Unknown patient"
            const meta = triageMeta(c.triageLevel)
            return (
              <Card key={c.id} className={cn("border-l-4 py-0", meta.colorClass.split(" ").find((cl) => cl.startsWith("border-")))}>
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  <PersonAvatar name={patientName} seed={c.patientId} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-foreground">{patientName}</span>
                    <span className="truncate text-sm text-muted-foreground">{c.chiefComplaint}</span>
                  </div>
                  <div className="flex flex-col text-xs text-muted-foreground">
                    <span>Arrived {formatDistanceToNow(new Date(c.arrivalTime), { addSuffix: true })}</span>
                    <span>
                      Doctor:{" "}
                      {c.assignedDoctorId ? `Practitioner/${c.assignedDoctorId}` : "Unassigned"}
                    </span>
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
