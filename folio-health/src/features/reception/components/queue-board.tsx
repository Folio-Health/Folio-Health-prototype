"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ListOrderedIcon, ClockIcon, UserCheckIcon, PlayIcon, CheckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { RoleGate } from "@/components/common/role-gate"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPatientById } from "@/lib/mock/patients"
import {
  QUEUE_DEPARTMENTS,
  QUEUE_ENTRIES,
  type QueueEntry,
  type QueueStatus,
} from "@/features/reception/lib/mock-data"

/**
 * Queue management (Implementation Manuscript §4.1).
 *
 * §4.1 lists check-in and queue management among the receptionist's
 * responsibilities. The dashboard already linked here; the route did not
 * exist, so the link 404'd.
 *
 * Reception owns the queue, so the state transitions are gated on CREATE —
 * the receptionist's one permission (§3: registration and biodata, nothing
 * clinical).
 */

const ALL = "All departments"

function QueueBoard() {
  const [department, setDepartment] = useState<string>(ALL)
  const [overrides, setOverrides] = useState<Record<string, QueueStatus>>({})

  const entries = useMemo(
    () => QUEUE_ENTRIES.map((entry) => ({ ...entry, status: overrides[entry.id] ?? entry.status })),
    [overrides]
  )

  const filtered = useMemo(
    () => entries.filter((e) => department === ALL || e.department === department),
    [entries, department]
  )

  const waiting = filtered.filter((e) => e.status === "Waiting")
  const serving = filtered.filter((e) => e.status === "Now Serving")
  const completed = filtered.filter((e) => e.status === "Completed")

  const averageWait = waiting.length
    ? Math.round(waiting.reduce((sum, e) => sum + e.estWaitMinutes, 0) / waiting.length)
    : 0

  function advance(entry: QueueEntry, next: QueueStatus) {
    setOverrides((prev) => ({ ...prev, [entry.id]: next }))
    const patient = getPatientById(entry.patientId)
    toast.success(
      next === "Now Serving" ? `Now serving ${entry.token}` : `${entry.token} marked completed`,
      { description: patient?.name }
    )
  }

  function QueueRow({ entry }: { entry: QueueEntry }) {
    const patient = getPatientById(entry.patientId)
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5">
        <Badge variant="outline" className="shrink-0 font-mono">
          {entry.token}
        </Badge>
        {patient && <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-medium text-foreground">
            {patient?.name ?? "Unknown patient"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {entry.department} &middot; checked in {format(new Date(entry.checkedInAt), "h:mm a")}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          ~{entry.estWaitMinutes} min
        </span>
        <StatusBadge status={entry.status} />
        <RoleGate permission="CREATE">
          {entry.status === "Waiting" && (
            <Button size="sm" variant="outline" onClick={() => advance(entry, "Now Serving")}>
              <PlayIcon />
              Call
            </Button>
          )}
          {entry.status === "Now Serving" && (
            <Button size="sm" variant="outline" onClick={() => advance(entry, "Completed")}>
              <CheckIcon />
              Complete
            </Button>
          )}
        </RoleGate>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Queue Management"
        description="The live waiting queue, by department"
        breadcrumbs={[
          { label: "Front Desk" },
          { label: "Reception", href: "/reception" },
          { label: "Queue Management" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting" value={waiting.length} icon={ClockIcon} tone="amber" />
        <StatCard label="Now Serving" value={serving.length} icon={UserCheckIcon} tone="violet" />
        <StatCard label="Completed" value={completed.length} icon={ListOrderedIcon} tone="emerald" />
        <StatCard label="Average Wait" value={`${averageWait} min`} icon={ClockIcon} />
      </div>

      <Tabs value={department} onValueChange={(v) => setDepartment(v ?? ALL)}>
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {[ALL, ...QUEUE_DEPARTMENTS].map((dept) => (
            <TabsTrigger
              key={dept}
              value={dept}
              className="rounded-md border border-transparent bg-muted/60 px-3 py-1.5 data-active:border-border data-active:bg-background"
            >
              {dept}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Now serving</CardTitle>
            <CardDescription>Patients currently with a clinician</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {serving.length === 0 ? (
              <EmptyState
                title="Nobody is being seen right now"
                description="Call the next waiting patient to start the queue moving."
              />
            ) : (
              serving.map((entry) => <QueueRow key={entry.id} entry={entry} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waiting</CardTitle>
            <CardDescription>
              {waiting.length} {waiting.length === 1 ? "patient" : "patients"} in the waiting area
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {waiting.length === 0 ? (
              <EmptyState
                title="The queue is empty"
                description="Patients appear here once they are checked in at the front desk."
              />
            ) : (
              waiting.map((entry) => <QueueRow key={entry.id} entry={entry} />)
            )}
          </CardContent>
        </Card>

        {completed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed today</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {completed.map((entry) => (
                <QueueRow key={entry.id} entry={entry} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export { QueueBoard }
