"use client"

import Link from "next/link"
import { format } from "date-fns"
import {
  CalendarDaysIcon,
  PillIcon,
  ReceiptIcon,
  MessageSquareIcon,
  ClipboardPlusIcon,
  FlaskConicalIcon,
  DownloadIcon,
  StethoscopeIcon,
  ArrowRightIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { PersonAvatar } from "@/components/common/person-avatar"
import {
  PORTAL_PATIENT,
  getPortalDoctor,
  getPortalUpcomingAppointments,
  getPortalActivePrescriptionCount,
  getPortalOutstandingBalance,
  getPortalUnreadMessageCount,
  getPortalLabResults,
  getPortalLatestVitals,
} from "@/lib/mock/portal"
import { formatNaira } from "@/lib/mock/billing"
import { getStaffById } from "@/lib/mock/staff"

const QUICK_LINKS = [
  { title: "Book Appointment", description: "Schedule a visit", href: "/portal/appointments", icon: CalendarDaysIcon },
  { title: "Medical Records", description: "History & conditions", href: "/portal/records", icon: ClipboardPlusIcon },
  { title: "Pay a Bill", description: "View & settle invoices", href: "/portal/bills", icon: ReceiptIcon },
  { title: "Message Care Team", description: "Ask a question", href: "/portal/messages", icon: MessageSquareIcon },
  { title: "Downloads", description: "Reports & documents", href: "/portal/downloads", icon: DownloadIcon },
]

function PortalDashboard() {
  const upcoming = getPortalUpcomingAppointments()
  const nextAppointment = upcoming[0]
  const nextAppointmentDoctor = nextAppointment ? getStaffById(nextAppointment.doctorId) : undefined
  const recentLabResults = getPortalLabResults().slice(0, 3)
  const latestVitals = getPortalLatestVitals()
  const doctor = getPortalDoctor()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Welcome back, {PORTAL_PATIENT.firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a quick look at your care with {doctor?.name ?? "your care team"}.
          </p>
        </div>
        <Button render={<Link href="/portal/appointments" />}>
          <CalendarDaysIcon />
          Book Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming Appointments"
          value={upcoming.length}
          icon={CalendarDaysIcon}
          tone="primary"
        />
        <StatCard
          label="Active Prescriptions"
          value={getPortalActivePrescriptionCount()}
          icon={PillIcon}
          tone="violet"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatNaira(getPortalOutstandingBalance())}
          icon={ReceiptIcon}
          tone={getPortalOutstandingBalance() > 0 ? "amber" : "emerald"}
        />
        <StatCard
          label="Unread Messages"
          value={getPortalUnreadMessageCount()}
          icon={MessageSquareIcon}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Next Appointment</CardTitle>
            <CardDescription>Your soonest upcoming visit</CardDescription>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <PersonAvatar
                    name={nextAppointmentDoctor?.name ?? "Doctor"}
                    seed={nextAppointmentDoctor?.avatarSeed}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {nextAppointmentDoctor?.name ?? "Unassigned Doctor"}
                    </span>
                    <span className="text-sm text-muted-foreground">{nextAppointment.reason}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(nextAppointment.startTime), "EEEE, MMM d 'at' h:mm a")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={nextAppointment.status} />
                  <Button variant="outline" size="sm" render={<Link href="/portal/appointments" />}>
                    View All
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDaysIcon}
                title="No upcoming appointments"
                description="Book a visit with your care team whenever you're ready."
                action={
                  <Button size="sm" render={<Link href="/portal/appointments" />}>
                    Book Appointment
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Vitals</CardTitle>
            <CardDescription>
              {latestVitals ? format(new Date(latestVitals.recordedAt), "MMM d, yyyy") : "No readings yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestVitals ? (
              <div className="grid grid-cols-2 gap-3">
                <VitalMetric label="Blood Pressure" value={`${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`} unit="mmHg" />
                <VitalMetric label="Heart Rate" value={String(latestVitals.pulse)} unit="bpm" />
                <VitalMetric label="Weight" value={String(latestVitals.weight)} unit="kg" />
                <VitalMetric label="BMI" value={String(latestVitals.bmi)} unit="" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Lab Results</CardTitle>
            <CardDescription>Latest results reviewed by your care team</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentLabResults.length === 0 ? (
              <EmptyState
                icon={FlaskConicalIcon}
                title="No lab results yet"
                description="Results from lab orders will appear here once available."
              />
            ) : (
              recentLabResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{result.testName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(result.orderedAt), "MMM d, yyyy")} &middot; {result.resultSummary}
                    </span>
                  </div>
                  <StatusBadge status={result.displayStatus} />
                </div>
              ))
            )}
          </CardContent>
          {recentLabResults.length > 0 && (
            <div className="px-4">
              <Link
                href="/portal/lab-results"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all results <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Care Team</CardTitle>
          </CardHeader>
          <CardContent>
            {doctor ? (
              <div className="flex items-center gap-3">
                <PersonAvatar name={doctor.name} seed={doctor.avatarSeed} size="lg" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{doctor.name}</span>
                  <span className="text-sm text-muted-foreground">{doctor.title}</span>
                  <span className="text-xs text-muted-foreground">{doctor.department}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <StethoscopeIcon className="size-5" />
                <span className="text-sm">No primary doctor assigned yet.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col gap-2 rounded-lg border border-border p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <link.icon className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{link.title}</span>
                  <span className="text-xs text-muted-foreground">{link.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VitalMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">
        {value} <span className="font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}

export { PortalDashboard }
