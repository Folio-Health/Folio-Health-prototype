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
import { triageMeta } from "@/lib/mock/emergency"
import { useErCases } from "../hooks/use-emergency"

const TRIAGE_TONE: Record<"Critical" | "Urgent" | "Standard", "red" | "amber" | "blue"> = {
  Critical: "red",
  Urgent: "amber",
  Standard: "blue",
}

function EmergencyQueue() {
  const { data: cases = [] } = useErCases(false)

  // Already ordered sickest-first, longest-waiting next by the hook.
  const queue = useMemo(() => cases.filter((c) => c.status === "Waiting"), [cases])

  const waitMinutes = useMemo(
    () =>
      queue
        .filter((c) => c.arrivalTime)
        .map((c) => Math.round((Date.now() - new Date(c.arrivalTime).getTime()) / 60000)),
    [queue]
  )
  const averageWaitMinutes = waitMinutes.length
    ? Math.round(waitMinutes.reduce((a, b) => a + b, 0) / waitMinutes.length)
    : 0
  const longestWaitMinutes = waitMinutes.length ? Math.max(...waitMinutes) : 0

  return (
    <div>
      <PageHeader
        title="Emergency Queue"
        description="Patients waiting to be seen, ordered by position"
        breadcrumbs={[{ label: "Emergency", href: "/emergency" }, { label: "Queue" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Patients Waiting" value={queue.length} icon={UsersIcon} />
        <StatCard label="Avg Wait Time" value={`${averageWaitMinutes}m`} icon={ClockIcon} tone="amber" />
        <StatCard label="Longest Wait" value={`${longestWaitMinutes}m`} icon={HourglassIcon} tone="red" />
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
            const patientName = c.patientName ?? "Unknown patient"
            const meta = triageMeta(c.triageLevel)
            return (
              <Card key={c.id} className="py-0">
                <CardContent className="flex items-center gap-4 py-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <PersonAvatar name={patientName} seed={c.patientId} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {patientName}
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
