"use client"

import { useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ClockIcon, ListOrderedIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { StatCard } from "@/components/cards/stat-card"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

const AVG_CONSULT_MINUTES = 20

function AppointmentQueue() {
  const queue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todays = APPOINTMENTS.filter(
      (a) => a.date === today && a.status !== "Cancelled" && a.status !== "No Show"
    ).sort((a, b) => a.startTime.localeCompare(b.startTime))

    let runningTime = new Date()
    return todays
      .map((a) => ({
        ...a,
        patient: getPatientById(a.patientId),
        doctor: getStaffById(a.doctorId),
      }))
      .filter((a) => a.patient && a.doctor)
      .map((a, i) => {
        let estimate: string
        if (a.status === "Completed") {
          estimate = "Seen"
        } else if (a.status === "In Progress") {
          estimate = "Now"
        } else {
          estimate = format(runningTime, "h:mm a")
          runningTime = new Date(runningTime.getTime() + AVG_CONSULT_MINUTES * 60_000)
        }
        return { ...a, position: i + 1, estimate }
      })
  }, [])

  const waitingCount = queue.filter((q) => q.status === "Scheduled" || q.status === "Checked In").length
  const inProgressCount = queue.filter((q) => q.status === "In Progress").length
  const completedCount = queue.filter((q) => q.status === "Completed").length

  return (
    <div>
      <PageHeader
        title="Appointment Queue"
        description="Today's appointments in queue order with estimated call times"
        breadcrumbs={[
          { label: "Front Desk" },
          { label: "Appointments", href: "/appointments" },
          { label: "Queue" },
        ]}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="In Queue" value={waitingCount} icon={ListOrderedIcon} />
        <StatCard label="In Progress" value={inProgressCount} tone="amber" />
        <StatCard label="Completed Today" value={completedCount} tone="emerald" />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="No appointments today"
          description="There are no queued appointments scheduled for today."
        />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {queue.map((entry) => (
              <Link
                key={entry.id}
                href={`/appointments/${entry.id}`}
                className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors first:pt-4 last:pb-4 hover:bg-muted/40"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground tabular-nums">
                  {entry.position}
                </span>
                <PersonAvatar name={entry.patient!.name} seed={entry.patient!.avatarSeed} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{entry.patient!.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.reason} &middot; {entry.doctor!.name}
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">{entry.department}</span>
                <div className="flex w-24 shrink-0 flex-col items-end">
                  <span className="text-xs text-muted-foreground">Est. call</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">{entry.estimate}</span>
                </div>
                <StatusBadge status={entry.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { AppointmentQueue }
