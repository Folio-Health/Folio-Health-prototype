"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  CalendarCheckIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  TimerIcon,
  ArrowRightIcon,
  StethoscopeIcon,
} from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { getDoctorKpis, getRandomDoctor } from "@/features/dashboard/lib/dashboard-data"
import { getAppointmentsForDoctor } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { useCurrentUser } from "@/lib/fhir/use-current-user"

function DoctorDashboard() {
  const { data: user } = useCurrentUser()
  // The schedule/KPI data below is still mock (no real Encounter/Appointment
  // FHIR data wired up yet), so it's keyed off a stand-in mock doctor id —
  // but the greeting itself must show the actual signed-in person, not a
  // random mock name next to their real identity in the sidebar.
  const mockDoctor = getRandomDoctor()
  const kpis = getDoctorKpis(mockDoctor.id)
  const today = new Date().toISOString().slice(0, 10)
  const schedule = getAppointmentsForDoctor(mockDoctor.id)
    .filter((a) => a.date === today)
    .slice(0, 6)

  const displayName = user?.name ?? mockDoctor.name

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-primary/4">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PersonAvatar name={displayName} size="lg" />
            <div className="flex flex-col">
              <p className="font-heading text-lg font-semibold text-foreground">
                Good morning, {displayName}
              </p>
              <p className="text-sm text-muted-foreground">
                {mockDoctor.title} &middot; {mockDoctor.department}
              </p>
            </div>
          </div>
          <Button render={<Link href="/consultation" />}>
            <StethoscopeIcon />
            Go to Workspace
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Appointments" value={kpis.todaysAppointments} icon={CalendarCheckIcon} />
        <StatCard label="Completed Today" value={kpis.completedToday} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Pending Reviews" value={kpis.pendingReviews} icon={ClipboardListIcon} tone="amber" />
        <StatCard label="Avg. Consult Time" value={`${kpis.avgConsultTime} min`} icon={TimerIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Your appointments for today</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/appointments" />}>
                View calendar
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <EmptyState
                title="No appointments today"
                description="Enjoy the quiet moment. New bookings will show up here."
              />
            ) : (
              <div className="flex flex-col gap-1">
                {schedule.map((apt) => {
                  const patient = getPatientById(apt.patientId)
                  if (!patient) return null
                  return (
                    <Link
                      key={apt.id}
                      href={`/consultation/${apt.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">
                        {new Date(apt.startTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <PersonAvatar name={patient.name} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-sm font-medium text-foreground">{patient.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{apt.reason}</p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              { label: "Write Prescription", href: "/pharmacy" },
              { label: "Order Lab Test", href: "/laboratory" },
              { label: "Request Imaging", href: "/radiology" },
              { label: "View My Patients", href: "/patients" },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="justify-between"
                render={<Link href={action.href as Route} />}
              >
                {action.label}
                <ArrowRightIcon className="size-3.5" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { DoctorDashboard }
