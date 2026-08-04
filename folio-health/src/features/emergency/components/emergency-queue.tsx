"use client"

import { useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { UsersIcon, ClockIcon, HourglassIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { getPatientById } from "@/lib/mock/patients"
import { getWaitingQueue, triageMeta, averageWaitMinutes, longestWaitMinutes } from "@/lib/mock/emergency"

const TRIAGE_TONE: Record<"Critical" | "Urgent" | "Standard", "red" | "amber" | "blue"> = {
  Critical: "red",
  Urgent: "amber",
  Standard: "blue",
}

function EmergencyQueue() {
  const queue = useMemo(() => getWaitingQueue(), [])

  return (
    <div>
      <PageHeader
        title="Emergency Queue"
        description="Patients waiting to be seen, ordered by position"
        breadcrumbs={[{ label: "Emergency", href: "/emergency" }, { label: "Queue" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Patients Waiting" value={queue.length} icon={UsersIcon} />
        <StatCard label="Avg Wait Time" value={`${averageWaitMinutes()}m`} icon={ClockIcon} tone="amber" />
        <StatCard label="Longest Wait" value={`${longestWaitMinutes()}m`} icon={HourglassIcon} tone="red" />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No one is waiting"
          description="Patients checked in and awaiting treatment will appear here in queue order."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {queue.map((c, index) => {
            const patient = getPatientById(c.patientId)
            const meta = triageMeta(c.triageLevel)
            return (
              <Card key={c.id} className="py-0">
                <CardContent className="flex items-center gap-4 py-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <PersonAvatar name={patient?.name ?? "Unknown"} seed={patient?.avatarSeed} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {patient?.name ?? "Unknown patient"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{c.chiefComplaint}</span>
                  </div>
                  <StatusBadge status={meta.badgeLabel} tone={TRIAGE_TONE[meta.badgeLabel]} />
                  <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                    Waiting {formatDistanceToNow(new Date(c.arrivalTime))}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { EmergencyQueue }
