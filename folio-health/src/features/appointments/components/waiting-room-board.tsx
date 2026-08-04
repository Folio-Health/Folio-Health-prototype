"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { MegaphoneIcon, UsersRoundIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { StatCard } from "@/components/cards/stat-card"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { getWaitMinutes } from "@/features/appointments/lib/wait-time"

function formatWait(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function WaitingRoomBoard() {
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set())

  const waiting = useMemo(() => {
    return APPOINTMENTS.filter((a) => a.status === "Checked In")
      .map((a) => ({
        ...a,
        patient: getPatientById(a.patientId),
        doctor: getStaffById(a.doctorId),
        waitMinutes: getWaitMinutes(a.id),
      }))
      .filter((a) => a.patient && a.doctor && !calledIds.has(a.id))
      .sort((a, b) => b.waitMinutes - a.waitMinutes)
  }, [calledIds])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof waiting>()
    for (const entry of waiting) {
      const key = entry.department
      map.set(key, [...(map.get(key) ?? []), entry])
    }
    return Array.from(map.entries())
  }, [waiting])

  const longestWait = waiting[0]?.waitMinutes ?? 0
  const avgWait = waiting.length
    ? Math.round(waiting.reduce((sum, w) => sum + w.waitMinutes, 0) / waiting.length)
    : 0

  function handleCallIn(id: string, patientName: string) {
    setCalledIds((prev) => new Set(prev).add(id))
    toast.success(`${patientName} called in`)
  }

  return (
    <div>
      <PageHeader
        title="Waiting Room"
        description="Patients currently checked in, sorted by longest wait"
        breadcrumbs={[
          { label: "Front Desk" },
          { label: "Appointments", href: "/appointments" },
          { label: "Waiting Room" },
        ]}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Patients Waiting" value={waiting.length} icon={UsersRoundIcon} />
        <StatCard label="Longest Wait" value={formatWait(longestWait)} tone="amber" />
        <StatCard label="Average Wait" value={formatWait(avgWait)} tone="violet" />
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={UsersRoundIcon}
          title="Waiting room is empty"
          description="No patients are currently checked in and waiting."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(([department, entries]) => (
            <Card key={department}>
              <CardHeader>
                <CardTitle>{department}</CardTitle>
                <CardDescription>{entries.length} waiting</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center gap-4 px-4 py-3 first:pt-4 last:pb-4"
                  >
                    <PersonAvatar name={entry.patient!.name} seed={entry.patient!.avatarSeed} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{entry.patient!.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.reason} &middot; {entry.doctor!.name}
                      </p>
                    </div>
                    <StatusBadge
                      status={entry.waitMinutes > 45 ? "Critical" : "Waiting"}
                      tone={entry.waitMinutes > 45 ? "red" : "amber"}
                    />
                    <span className="w-20 shrink-0 text-right text-sm font-medium text-foreground tabular-nums">
                      {formatWait(entry.waitMinutes)}
                    </span>
                    <Button size="sm" onClick={() => handleCallIn(entry.id, entry.patient!.name)}>
                      <MegaphoneIcon />
                      Call In
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { WaitingRoomBoard }
