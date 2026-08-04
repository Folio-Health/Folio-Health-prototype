"use client"

import { useMemo } from "react"
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
import { getTodaysAppointments } from "@/lib/mock/appointments"
import type { Appointment } from "@/types/core"

function ConsultationHub() {
  const router = useRouter()
  const todaysAppointments = useMemo(
    () =>
      [...getTodaysAppointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    []
  )

  const stats = useMemo(() => {
    const completed = todaysAppointments.filter((a) => a.status === "Completed").length
    const inProgress = todaysAppointments.filter(
      (a) => a.status === "In Progress" || a.status === "Checked In"
    ).length
    const totalMinutes = todaysAppointments.reduce((sum, a) => {
      const mins = (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000
      return sum + mins
    }, 0)
    const avgDuration = todaysAppointments.length
      ? Math.round(totalMinutes / todaysAppointments.length)
      : 0

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
        data={todaysAppointments as Appointment[]}
        onRowClick={(apt) => router.push(`/consultation/${apt.id}`)}
        emptyTitle="No consultations scheduled today"
        emptyDescription="Appointments booked for today will appear here, ready to start."
      />
    </div>
  )
}

export { ConsultationHub }
