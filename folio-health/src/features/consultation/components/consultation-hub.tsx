"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheckIcon,
  CheckCircle2Icon,
  StethoscopeIcon,
  TimerIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { DataTable } from "@/components/tables/data-table"
import { consultationColumns } from "./consultation-columns"
import { useAppointmentsForDay } from "@/features/appointments/hooks/use-appointments"

function ConsultationHub() {
  const router = useRouter()
  // `today` is held in state, not recomputed each render: a new Date() in the
  // render body changes the query key on every pass and re-fetches forever.
  const [today] = useState(() => new Date())
  const { data, isLoading, isError } = useAppointmentsForDay(today)

  // `null` is the deliberate "your role has no Appointment grant" signal from
  // the hook — distinct from an empty day, and it must not read as one.
  const notPermitted = data === null
  const todaysAppointments = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "")),
    [data]
  )

  const stats = useMemo(() => {
    const completed = todaysAppointments.filter((a) => a.status === "fulfilled").length
    const inProgress = todaysAppointments.filter((a) => a.status === "arrived").length
    const totalMinutes = todaysAppointments.reduce((sum, a) => {
      if (!a.start || !a.end) return sum
      return sum + (new Date(a.end).getTime() - new Date(a.start).getTime()) / 60000
    }, 0)
    // Averaged over appointments that actually carry both times, so one
    // open-ended booking does not drag the average toward zero.
    const timed = todaysAppointments.filter((a) => a.start && a.end).length
    const avgDuration = timed ? Math.round(totalMinutes / timed) : 0

    return { completed, inProgress, avgDuration }
  }, [todaysAppointments])

  return (
    <div>
      <PageHeader
        title="Consultation"
        description="Doctor workspace for today's patient consultations"
        breadcrumbs={[{ label: "Clinical" }, { label: "Consultation" }]}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Consultations"
          value={todaysAppointments.length}
          icon={CalendarCheckIcon}
        />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="In Progress" value={stats.inProgress} icon={StethoscopeIcon} tone="amber" />
        <StatCard
          label="Avg. Duration"
          value={`${stats.avgDuration} min`}
          icon={TimerIcon}
          tone="violet"
        />
      </div>

      <DataTable
        columns={consultationColumns}
        data={todaysAppointments}
        isLoading={isLoading}
        onRowClick={(apt) => apt.id && router.push(`/consultation/${apt.id}`)}
        emptyTitle={
          notPermitted
            ? "Not available for your role"
            : isError
              ? "Could not load consultations"
              : "No consultations scheduled today"
        }
        emptyDescription={
          notPermitted
            ? "Your role does not have access to the appointment schedule."
            : isError
              ? "Check your connection and try again."
              : "Appointments booked for today will appear here, ready to start."
        }
      />
    </div>
  )
}

export { ConsultationHub }
