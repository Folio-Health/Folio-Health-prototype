"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { DoorClosedIcon, CheckCircle2Icon, SparklesIcon, CalendarClockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { THEATRES_LIST, SURGERIES_LIST, getSurgeryById, theatreUtilization } from "@/lib/mock/surgery"

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
  const theatres = useMemo(() => {
    return THEATRES_LIST.map((theatre) => {
      if (theatre.status === "In Use") {
        return { ...theatre, displayStatus: "In Use" as DisplayStatus, upcoming: undefined }
      }
      const upcoming =
        theatre.status === "Available"
          ? SURGERIES_LIST.filter(
              (s) => s.theatreNumber === theatre.number && s.status === "Scheduled" && isToday(s.date)
            ).sort((a, b) => +new Date(a.scheduledTime) - +new Date(b.scheduledTime))[0]
          : undefined
      return {
        ...theatre,
        displayStatus: (upcoming ? "Scheduled" : theatre.status) as DisplayStatus,
        upcoming,
      }
    })
  }, [])

  const inUseCount = theatres.filter((t) => t.displayStatus === "In Use").length
  const availableCount = theatres.filter((t) => t.displayStatus === "Available").length
  const cleaningCount = theatres.filter((t) => t.status === "Cleaning").length

  return (
    <div>
      <PageHeader
        title="Operating Theatre Dashboard"
        description={`${THEATRES_LIST.length} theatres · ${theatreUtilization()}% utilization`}
        breadcrumbs={[{ label: "Surgery" }, { label: "Theatre Dashboard" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In Use" value={inUseCount} icon={DoorClosedIcon} tone="primary" />
        <StatCard label="Available" value={availableCount} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Cleaning" value={cleaningCount} icon={SparklesIcon} tone="amber" />
        <StatCard label="Utilization" value={`${theatreUtilization()}%`} icon={CalendarClockIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {theatres.map((theatre) => {
          const currentSurgery = theatre.currentSurgeryId ? getSurgeryById(theatre.currentSurgeryId) : undefined
          const patient = currentSurgery ? getPatientById(currentSurgery.patientId) : undefined
          const surgeon = currentSurgery ? getStaffById(currentSurgery.surgeonId) : undefined
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
