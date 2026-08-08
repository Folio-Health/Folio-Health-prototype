"use client"

import Link from "next/link"
import { format } from "date-fns"
import {
  UsersIcon,
  CalendarDaysIcon,
  ActivityIcon,
  StethoscopeIcon,
  Building2Icon,
  FlaskConicalIcon,
  ArrowRightIcon,
} from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState, ErrorState } from "@/components/common/empty-state"
import { StatCardGridSkeleton, ListSkeleton, ChartCardSkeleton } from "@/components/common/loading-skeletons"
import {
  useDashboardMetrics,
  useRecentActivity,
  useUpcomingAppointments,
  useWeeklyAppointments,
} from "../hooks/use-dashboard-metrics"

/**
 * Every figure on this screen is counted by the FHIR server.
 *
 * Where the data genuinely does not exist yet, the tile shows 0 and the panel
 * shows an empty state — deliberately, rather than substituting a plausible
 * number. A dashboard that invents numbers is worse than one that reads zero.
 */
function AdminDashboard() {
  const metrics = useDashboardMetrics()
  const weekly = useWeeklyAppointments()
  const activity = useRecentActivity()
  const upcoming = useUpcomingAppointments()

  if (metrics.isError) {
    return (
      <ErrorState
        title="Could not load dashboard"
        description={
          metrics.error instanceof Error
            ? metrics.error.message
            : "Could not reach Folio. Check your connection and try again."
        }
        action={
          <Button variant="outline" onClick={() => void metrics.refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  const data = metrics.data

  return (
    <div className="flex flex-col gap-6">
      {metrics.isLoading || !data ? (
        <StatCardGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {/* Tiles link out only where a screen actually exists — a figure you
              can't click through to is a dead end. */}
          <Link href="/patients" className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50">
            <StatCard label="Patients" value={data.patients} icon={UsersIcon} />
          </Link>
          <Link
            href="/appointments"
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <StatCard
              label="Appointments Today"
              value={data.appointmentsToday}
              icon={CalendarDaysIcon}
              tone="violet"
            />
          </Link>
          <StatCard
            label="Active Encounters"
            value={data.activeEncounters}
            icon={ActivityIcon}
            tone="emerald"
          />
          <StatCard label="Practitioners" value={data.practitioners} icon={StethoscopeIcon} />
          <Link
            href="/facilities"
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <StatCard
              label="Facilities"
              value={data.organizations}
              icon={Building2Icon}
              tone="amber"
            />
          </Link>
          <StatCard
            label="Open Lab Orders"
            value={data.pendingLabOrders}
            icon={FlaskConicalIcon}
            tone="violet"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Volume</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {weekly.isLoading ? (
              <ChartCardSkeleton />
            ) : (
              <TrendChart
                data={weekly.data ?? []}
                xKey="day"
                series={[
                  { key: "appointments", label: "Appointments", color: "var(--chart-1)" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                render={<Link href="/appointments" />}
              >
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcoming.isLoading ? (
              <ListSkeleton />
            ) : upcoming.data?.length ? (
              upcoming.data.map((appointment) => {
                const patient = appointment.participant?.find((p) =>
                  p.actor?.reference?.startsWith("Patient/")
                )?.actor
                return (
                  <div key={appointment.id} className="flex items-center gap-3">
                    <PersonAvatar name={patient?.display ?? "Unknown"} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">
                        {patient?.display ?? "Unnamed patient"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {appointment.description ?? appointment.status}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {appointment.start ? format(new Date(appointment.start), "d MMM HH:mm") : "—"}
                    </span>
                  </div>
                )
              })
            ) : (
              <EmptyState
                title="Nothing scheduled"
                description="No upcoming appointments."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Audit trail</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              render={<Link href="/administration/audit-logs" />}
            >
              View all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {activity.isLoading ? (
            <ListSkeleton />
          ) : activity.data?.length ? (
            activity.data.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span
                  className={
                    item.outcome && item.outcome !== "0"
                      ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive"
                      : "mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.when ? format(new Date(item.when), "d MMM yyyy, HH:mm") : "—"}
                    {" · "}
                    {item.who}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No recorded activity" description="The audit trail is empty." />
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-fit gap-1.5"
            render={<Link href="/patients" />}
          >
            Go to Patients
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export { AdminDashboard }
