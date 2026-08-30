"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  UserPlusIcon,
  UserSearchIcon,
  ZapIcon,
  ClipboardCheckIcon,
  ListOrderedIcon,
  MonitorIcon,
  IdCardIcon,
  UsersIcon,
  ClockIcon,
  UserCheckIcon,
  UserXIcon,
  ArrowRightIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { useAppointmentsForDay } from "@/features/appointments/hooks/use-appointments"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { appointmentPatient, appointmentPractitioner } from "@/lib/appointments/logic"

const QUICK_LINKS = [
  {
    title: "Patient Registration",
    description: "Register a new patient with the full intake wizard",
    href: "/reception/register",
    icon: UserPlusIcon,
  },
  {
    title: "Returning Patient",
    description: "Search an existing patient by MRN, phone, or name",
    href: "/reception/returning-patient",
    icon: UserSearchIcon,
  },
  {
    title: "Walk In Registration",
    description: "Fast single page intake for walk in visits",
    href: "/reception/walk-in",
    icon: ZapIcon,
  },
  {
    title: "Check In",
    description: "Check in today's scheduled appointments",
    href: "/reception/check-in",
    icon: ClipboardCheckIcon,
  },
  {
    title: "Queue Management",
    description: "Manage the live waiting queue by department",
    href: "/reception/queue",
    icon: ListOrderedIcon,
  },
  {
    title: "Token Display",
    description: "Live now serving board for the waiting area",
    href: "/reception/token-system",
    icon: MonitorIcon,
  },
  {
    title: "Print Patient ID Card",
    description: "Preview and print a patient's ID card",
    href: "/reception/print-card",
    icon: IdCardIcon,
  },
]

/** FHIR appointment status to the words a receptionist uses. */
const STATUS_LABELS: Record<string, string> = {
  booked: "Scheduled",
  arrived: "Checked In",
  fulfilled: "Completed",
  cancelled: "Cancelled",
  noshow: "No Show",
}

function ReceptionDashboard() {
  // Stable query key across renders.
  const [today] = useState(() => new Date())
  const { data } = useAppointmentsForDay(today)
  const todaysAppointments = useMemo(() => data ?? [], [data])

  const checkedInToday = todaysAppointments.filter((a) =>
    ["arrived", "fulfilled"].includes(a.status ?? "")
  )
  const noShows = todaysAppointments.filter((a) => a.status === "noshow")
  // "Waiting" is arrived-but-not-yet-seen. It comes from the appointments
  // themselves now; the old QUEUE_ENTRIES was a separate fabricated list that
  // could disagree with the schedule shown right beside it.
  const waiting = todaysAppointments.filter((a) => a.status === "arrived")

  // The patient list is sorted newest-first by the server, so the head of it
  // IS the recent registrations. The old version sorted a mock array by a
  // `registeredAt` field that FHIR does not carry.
  const { data: patientData } = usePatients({})
  const recentRegistrations = (patientData?.patients ?? []).slice(0, 6)

  const queueRows = todaysAppointments
    .slice()
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reception"
        description="Front desk hub for patient check in, registration, and queue management"
        breadcrumbs={[{ label: "Front Desk" }, { label: "Reception" }]}
        actions={
          <Button render={<Link href="/reception/register" />}>
            <UserPlusIcon />
            Register Patient
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Checked In Today" value={checkedInToday.length} icon={UserCheckIcon} tone="emerald" />
        <StatCard label="Waiting" value={waiting.length} icon={ClockIcon} tone="amber" />
        <StatCard label="New Registrations" value={recentRegistrations.length} icon={UsersIcon} tone="primary" />
        <StatCard
          label="No shows"
          value={noShows.length}
          icon={UserXIcon}
          tone="red"
          delta={noShows.length > 0 ? { value: noShows.length, isGoodWhenUp: false, comparedTo: "today" } : undefined}
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Quick Actions</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Card key={link.href} className="transition-colors hover:bg-muted/40">
              <Link href={link.href} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <link.icon className="size-4.5" />
                  </div>
                  <CardTitle className="mt-2">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Check In Queue</CardTitle>
          <CardDescription>Upcoming and recent appointments for today</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/reception/check-in" />}>
              View all
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {queueRows.length === 0 ? (
            <EmptyState title="No appointments today" description="There are no scheduled appointments for today." />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {queueRows.map((apt) => {
                const patient = appointmentPatient(apt)
                const doctor = appointmentPractitioner(apt)
                const name = patient?.display ?? "Unknown patient"
                return (
                  <div key={apt.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <PersonAvatar name={name} seed={patient?.reference ?? apt.id} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doctor?.display ?? "Unassigned"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {apt.start
                        ? new Date(apt.start).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                    <StatusBadge status={STATUS_LABELS[apt.status ?? "booked"] ?? apt.status} />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { ReceptionDashboard }
