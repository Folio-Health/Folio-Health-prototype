"use client"

import Link from "next/link"
import { useMemo } from "react"
import { format } from "date-fns"
import {
  ActivityIcon,
  ClipboardListIcon,
  KeyRoundIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
  UsersRoundIcon,
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
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/cards/stat-card"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton, StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { ROLE_LABELS, type RoleId } from "@/lib/auth/roles"
import { useFacilityStaff } from "@/features/administration/hooks/use-facility-staff"
import { useFacilityAdminMetrics, useRecentActivity } from "../hooks/use-dashboard-metrics"

/**
 * Hospital (facility) administrator dashboard — EMR V1 RBAC spec §7.8:
 * "accounts, roles and infrastructure; clinical content none".
 *
 * Every figure is something this role is actually permitted to read: its own
 * facility's staff accounts (admin plane), patient registrations and the audit
 * trail (both compartment-scoped by the Facility Admin AccessPolicy). No
 * encounter, order or appointment counts are requested — not hidden after a
 * 403, simply never asked for.
 *
 * Each panel degrades on its own. A source this admin cannot reach shows
 * "unavailable" in place, never a page-level error: the rest of the dashboard
 * is still true.
 */
function FacilityAdminDashboard() {
  const { data: user } = useCurrentUser()
  const facilityId = user?.facilityId ?? null

  const staff = useFacilityStaff(facilityId)
  const metrics = useFacilityAdminMetrics()
  const activity = useRecentActivity(6)

  const accounts = useMemo(() => staff.data?.staff ?? [], [staff.data])
  const activeCount = accounts.filter((s) => s.active).length
  const awaitingPassword = accounts.filter((s) => s.mustChangePassword).length

  const byRole = useMemo(() => {
    const counts = new Map<string, { label: string; total: number; active: number }>()
    for (const member of accounts) {
      const key = member.role ?? "unassigned"
      const label =
        member.roleLabel ??
        (member.role && member.role in ROLE_LABELS
          ? ROLE_LABELS[member.role as RoleId]
          : "No role assigned")
      const entry = counts.get(key) ?? { label, total: 0, active: 0 }
      entry.total += 1
      if (member.active) entry.active += 1
      counts.set(key, entry)
    }
    return Array.from(counts.values()).sort((a, b) => b.total - a.total)
  }, [accounts])

  const staffUnavailable = staff.isError || (!facilityId && !staff.isPending)

  return (
    <div className="flex flex-col gap-6">
      {staff.isPending && facilityId ? (
        <StatCardGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <Link
            href="/administration/users"
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <StatCard
              label="Staff Accounts"
              value={staffUnavailable ? "—" : accounts.length}
              icon={UsersIcon}
            />
          </Link>
          <StatCard
            label="Active Accounts"
            value={staffUnavailable ? "—" : activeCount}
            icon={UserCheckIcon}
            tone="emerald"
          />
          <StatCard
            label="Awaiting Password"
            value={staffUnavailable ? "—" : awaitingPassword}
            icon={KeyRoundIcon}
            tone="violet"
          />
          <Link href="/patients" className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50">
            <StatCard
              label="Registered Patients"
              value={metrics.data?.patients ?? "—"}
              icon={UsersRoundIcon}
              tone="cyan"
            />
          </Link>
          <Link
            href="/administration/audit-logs"
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <StatCard
              label="Audit Events Today"
              value={metrics.data?.auditEventsToday ?? "—"}
              icon={ShieldCheckIcon}
              tone="amber"
            />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Accounts by Role</CardTitle>
            <CardDescription>
              {user?.facilityName ? `Who holds access at ${user.facilityName}` : "Who holds access at your facility"}
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                render={<Link href="/administration/roles" />}
              >
                Manage roles
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {staff.isPending && facilityId ? (
              <ListSkeleton />
            ) : staffUnavailable ? (
              <Unavailable
                message={
                  staff.error instanceof Error
                    ? staff.error.message
                    : "Staff accounts could not be loaded for your facility."
                }
              />
            ) : byRole.length === 0 ? (
              <EmptyState
                icon={ClipboardListIcon}
                title="No staff accounts yet"
                description="Create the first account for your facility from Administration → Users."
              />
            ) : (
              byRole.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground">{row.label}</p>
                  <div className="flex items-center gap-2">
                    {row.active < row.total && (
                      <Badge variant="outline" className="text-xs">
                        {row.total - row.active} inactive
                      </Badge>
                    )}
                    <span className="text-sm font-medium tabular-nums">{row.total}</span>
                  </div>
                </div>
              ))
            )}
            {staff.data?.truncated && (
              <p className="text-xs text-muted-foreground">
                Showing the first page of accounts only — open Users for the full list.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button render={<Link href="/administration/users" />}>
              <UserPlusIcon />
              Create staff account
            </Button>
            <Button variant="outline" render={<Link href="/administration/permissions" />}>
              <ShieldCheckIcon />
              Review permissions
            </Button>
            <Button variant="outline" render={<Link href="/administration/audit-logs" />}>
              <ScrollTextIcon />
              Open audit logs
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest entries in your facility&apos;s audit trail</CardDescription>
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
          ) : activity.isError ? (
            <Unavailable message="The audit trail could not be loaded." />
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
                    {item.who}
                    {item.when ? ` · ${format(new Date(item.when), "d MMM, HH:mm")}` : ""}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={ActivityIcon}
              title="No activity recorded yet"
              description="Audit events appear here as staff use the system."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Unavailable({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
}

export { FacilityAdminDashboard }
