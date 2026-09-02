"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { DoorClosedIcon, CheckCircle2Icon, SparklesIcon, CalendarClockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { THEATRES_LIST } from "@/lib/mock/surgery"
import { useSurgeries, type SurgeryWithPatient } from "../hooks/use-surgery"

type DisplayStatus = "In Use" | "Available" | "Cleaning" | "Scheduled"

const STATUS_TONE: Record<DisplayStatus, "blue" | "green" | "amber" | "violet"> = {
  "In Use": "blue",
  Available: "green",
  Cleaning: "amber",
  Scheduled: "violet",
}

const STATUS_ICON: Record<DisplayStatus, typeof DoorClosedIcon> = {
  "In Use": DoorClosedIcon,
  Available: CheckCircle2Icon,
  Cleaning: SparklesIcon,
  Scheduled: CalendarClockIcon,
}

function TheatreDashboard() {
  const { data: surgeries = [], isLoading } = useSurgeries()

  const theatres = useMemo(() => {
    return THEATRES_LIST.map((theatre) => {
      // A theatre is In Use when an operation in it is actually in progress —
      // derived from the schedule rather than from a separately-maintained
      // theatre status that could disagree with it.
      const inProgress = surgeries.find(
        (s) => s.theatreNumber === theatre.number && s.status === "In Progress"
      )
      if (inProgress) {
        return {
          ...theatre,
          displayStatus: "In Use" as DisplayStatus,
          upcoming: undefined,
          current: inProgress,
        }
      }

      const upcoming = surgeries
        .filter(
          (s) =>
            s.theatreNumber === theatre.number && s.status === "Scheduled" && isToday(s.date)
        )
        .sort((a, b) => +new Date(a.scheduledTime) - +new Date(b.scheduledTime))[0]

      return {
        ...theatre,
        displayStatus: (upcoming ? "Scheduled" : theatre.status) as DisplayStatus,
        upcoming,
        current: undefined,
      }
    })
  }, [surgeries])

  // Utilisation is theatres currently operating, out of all theatres.
  const theatreUtilization = THEATRES_LIST.length
    ? Math.round(
        (theatres.filter((t) => t.displayStatus === "In Use").length / THEATRES_LIST.length) * 100
      )
    : 0

  const inUseCount = theatres.filter((t) => t.displayStatus === "In Use").length
  const availableCount = theatres.filter((t) => t.displayStatus === "Available").length
  const cleaningCount = theatres.filter((t) => t.status === "Cleaning").length

  return (
    <div>
      <PageHeader
        title="Operating Theatre Dashboard"
        description={
          isLoading
            ? "Loading..."
            : `${THEATRES_LIST.length} theatres · ${theatreUtilization}% utilization`
        }
        breadcrumbs={[{ label: "Surgery" }, { label: "Theatre Dashboard" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In Use" value={inUseCount} icon={DoorClosedIcon} tone="primary" />
        <StatCard label="Available" value={availableCount} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Cleaning" value={cleaningCount} icon={SparklesIcon} tone="amber" />
        <StatCard label="Utilization" value={`${theatreUtilization}%`} icon={CalendarClockIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {theatres.map((theatre) => {
          // The in-progress operation for this theatre, derived above.
          const currentSurgery = theatre.current
          const patient = currentSurgery
            ? { name: (currentSurgery as SurgeryWithPatient).patientName ?? "Patient" }
            : undefined
          const surgeon = currentSurgery?.surgeonId
            ? { name: `Practitioner/${currentSurgery.surgeonId}` }
            : undefined
          const Icon = STATUS_ICON[theatre.displayStatus]

          return (
            <Card key={theatre.number}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Theatre {theatre.number}</CardTitle>
                  <StatusBadge status={theatre.displayStatus} tone={STATUS_TONE[theatre.displayStatus]} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                {theatre.displayStatus === "In Use" && currentSurgery ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-foreground">{currentSurgery.procedure}</p>
                    <p className="text-xs text-muted-foreground">Patient: {patient?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">Surgeon: {surgeon?.name ?? "Unassigned"}</p>
                    <p className="text-xs text-muted-foreground">
                      Started {format(new Date(currentSurgery.scheduledTime), "h:mm a")}
                    </p>
                  </div>
                ) : theatre.displayStatus === "Scheduled" && theatre.upcoming ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-foreground">{theatre.upcoming.procedure}</p>
                    <p className="text-xs text-muted-foreground">
                      Next case at {format(new Date(theatre.upcoming.scheduledTime), "h:mm a")}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {theatre.status === "Cleaning" ? "Turnover cleaning in progress." : "No active procedure."}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export { TheatreDashboard }
