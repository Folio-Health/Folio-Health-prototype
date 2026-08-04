import Link from "next/link"
import {
  UsersIcon,
  CalendarDaysIcon,
  BedDoubleIcon,
  DoorOpenIcon,
  SirenIcon,
  FlaskConicalIcon,
  ArrowRightIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { cn } from "@/lib/utils"
import {
  getAdminKpis,
  getWeeklyPatientVisits,
  getDepartmentLoad,
  getRecentActivity,
  getEmergencyAlerts,
  getUpcomingAppointmentsPreview,
} from "@/features/dashboard/lib/dashboard-data"

const SEVERITY_STYLES = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
}

function AdminDashboard() {
  const kpis = getAdminKpis()
  const weeklyVisits = getWeeklyPatientVisits()
  const departmentLoad = getDepartmentLoad()
  const activity = getRecentActivity()
  const alerts = getEmergencyAlerts()
  const upcoming = getUpcomingAppointmentsPreview()
  const totalDeptLoad = departmentLoad.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Today's Patients"
          value={kpis.todaysPatients}
          icon={UsersIcon}
          delta={{ value: kpis.todaysPatientsDelta, comparedTo: "yesterday" }}
        />
        <StatCard
          label="Appointments"
          value={kpis.appointments}
          icon={CalendarDaysIcon}
          tone="violet"
          delta={{ value: kpis.appointmentsDelta, comparedTo: "yesterday" }}
        />
        <StatCard
          label="Admissions"
          value={kpis.admissions}
          icon={BedDoubleIcon}
          tone="emerald"
          delta={{ value: kpis.admissionsDelta, comparedTo: "yesterday" }}
        />
        <StatCard
          label="Discharges"
          value={kpis.discharges}
          icon={DoorOpenIcon}
          tone="amber"
          delta={{ value: kpis.dischargesDelta, comparedTo: "yesterday" }}
        />
        <StatCard
          label="Emergency Cases"
          value={kpis.emergencyCases}
          icon={SirenIcon}
          tone="red"
          delta={{ value: kpis.emergencyDelta, isGoodWhenUp: false, comparedTo: "yesterday" }}
        />
        <StatCard
          label="Pending Lab Tests"
          value={kpis.pendingLabTests}
          icon={FlaskConicalIcon}
          tone="violet"
          delta={{ value: kpis.pendingLabDelta, isGoodWhenUp: false, comparedTo: "yesterday" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Patient Visits</CardTitle>
            <CardDescription>This week</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={weeklyVisits}
              xKey="day"
              series={[{ key: "visits", label: "Visits", color: "var(--chart-1)" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Load</CardTitle>
            <CardDescription>Active cases by unit</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={departmentLoad} centerLabel="Total" centerValue={totalDeptLoad} size={140} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/communication/notifications" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.time} &middot; {item.by}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/appointments" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
            )}
            {upcoming.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3">
                <PersonAvatar name={apt.patient!.name} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">
                    {apt.patient!.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{apt.doctor!.name}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(apt.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Alerts</CardTitle>
            <CardAction>
              <StatusBadge status="Critical" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    SEVERITY_STYLES[alert.severity]
                  )}
                >
                  <TriangleAlertIcon className="size-3.5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-1 gap-1.5" render={<Link href="/emergency" />}>
              Go to Emergency Dashboard
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { AdminDashboard }
