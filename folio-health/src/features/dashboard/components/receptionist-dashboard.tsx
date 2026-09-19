"use client"

import Link from "next/link"
import {
  CalendarCheckIcon,
  ClockIcon,
  StethoscopeIcon,
  TicketIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { EmptyState } from "@/components/common/empty-state"
import { StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { useFrontDeskDashboard } from "../hooks/use-role-dashboards"

/**
 * Front desk dashboard — real figures only, under the Front Desk AccessPolicy
 * (Patient, Practitioner, Organization, AuditEvent). Appointments and
 * check-in queues have no granted resource / data model yet, so those render
 * a dash and an empty panel rather than invented numbers.
 */
function ReceptionistDashboard() {
  const { data, isLoading } = useFrontDeskDashboard()

  return (
    <div className="flex flex-col gap-6">
      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Registered Patients" value={data.patients ?? "—"} icon={UsersIcon} />
          <StatCard
            label="Patient Records Touched Today"
            value={data.patientsTouchedToday ?? "—"}
            icon={UserPlusIcon}
            tone="emerald"
          />
          <StatCard
            label="Practitioners"
            value={data.practitioners ?? "—"}
            icon={StethoscopeIcon}
            tone="violet"
          />
          <StatCard
            label="Appointments Today"
            value={data.appointmentsToday ?? "—"}
            icon={CalendarCheckIcon}
            tone="amber"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Front Desk Queue</CardTitle>
            <CardDescription>Patients waiting for check-in or consultation</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ClockIcon}
              title="No live queue wired up yet"
              description="Check-ins aren't backed by a real waiting-queue data model yet — this is where the queue will appear once that exists."
            />
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
