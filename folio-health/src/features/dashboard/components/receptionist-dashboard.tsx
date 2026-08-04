import Link from "next/link"
import { UserPlusIcon, UsersIcon, ClockIcon, CalendarCheckIcon, TicketIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { getUpcomingAppointmentsPreview } from "@/features/dashboard/lib/dashboard-data"

function ReceptionistDashboard() {
  const queue = getUpcomingAppointmentsPreview()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Checked In Today" value={64} icon={UsersIcon} />
        <StatCard label="Waiting Queue" value={9} icon={ClockIcon} tone="amber" />
        <StatCard label="New Registrations" value={14} icon={UserPlusIcon} tone="emerald" />
        <StatCard label="Appointments Today" value={86} icon={CalendarCheckIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Front Desk Queue</CardTitle>
            <CardDescription>Patients waiting for check-in or consultation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {queue.map((apt, i) => (
              <div key={apt.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <PersonAvatar name={apt.patient!.name} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{apt.patient!.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{apt.doctor!.name}</p>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button render={<Link href="/reception/register" />}>
              <UserPlusIcon />
              Register New Patient
            </Button>
            <Button variant="outline" render={<Link href="/reception/check-in" />}>
              Patient Check-in
            </Button>
            <Button variant="outline" render={<Link href="/reception/queue" />}>
              <TicketIcon />
              Queue Management
            </Button>
            <Button variant="outline" render={<Link href="/appointments" />}>
              View Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { ReceptionistDashboard }
