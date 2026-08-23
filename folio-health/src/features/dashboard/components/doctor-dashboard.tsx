"use client"

import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import {
  ActivityIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  FlaskConicalIcon,
  PillIcon,
  StethoscopeIcon,
  UsersIcon,
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
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton, StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { subjectLabel, useDoctorDashboard } from "../hooks/use-role-dashboards"

/**
 * Doctor dashboard — every figure is a real count from the FHIR server under
 * this doctor's own AccessPolicy. A resource the policy does not grant shows a
 * dash; a resource with no data yet shows zero or an empty state. Nothing is
 * simulated. (Appointments are not part of the Doctor policy today, which is
 * why there is no schedule panel — in-progress encounters are the real
 * equivalent the policy does grant.)
 */
function DoctorDashboard() {
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useDoctorDashboard()

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-primary/4">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PersonAvatar name={user?.name ?? "Doctor"} size="lg" />
            <div className="flex flex-col">
              <p className="font-heading text-lg font-semibold text-foreground">
                Welcome, {user?.name ?? "Doctor"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.facilityName ?? "Your facility"}
              </p>
            </div>
          </div>
          <Button render={<Link href="/consultation" />}>
            <StethoscopeIcon />
            Go to Workspace
          </Button>
        </CardContent>
      </Card>

      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Patients" value={data.patients ?? "—"} icon={UsersIcon} />
          <StatCard
            label="Active Encounters"
            value={data.activeEncounters ?? "—"}
            icon={ActivityIcon}
            tone="emerald"
          />
          <StatCard
            label="Pending Lab Orders"
            value={data.pendingLabOrders ?? "—"}
            icon={FlaskConicalIcon}
            tone="amber"
          />
          <StatCard
            label="Active Prescriptions"
            value={data.activePrescriptions ?? "—"}
            icon={PillIcon}
            tone="violet"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Encounters</CardTitle>
            <CardDescription>Consultations currently in progress</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                render={<Link href="/consultation" />}
              >
                Open workspace
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton />
            ) : data?.encounters === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Not available for your role.
              </p>
            ) : !data?.encounters?.length ? (
              <EmptyState
                icon={ClipboardListIcon}
                title="No encounters in progress"
                description="Encounters started in the consultation workspace appear here."
              />
            ) : (
              <div className="flex flex-col gap-1">
                {data.encounters.map((encounter) => (
                  <div
                    key={encounter.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">
                      {encounter.period?.start
                        ? format(new Date(encounter.period.start), "HH:mm")
                        : "—"}
                    </span>
                    <PersonAvatar name={subjectLabel(encounter)} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">
                        {subjectLabel(encounter)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {encounter.type?.[0]?.text ??
                          encounter.type?.[0]?.coding?.[0]?.display ??
                          "Encounter"}
                      </p>
                    </div>
                    <StatusBadge status={encounter.status ?? "unknown"} />
                  </div>
                ))}
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
