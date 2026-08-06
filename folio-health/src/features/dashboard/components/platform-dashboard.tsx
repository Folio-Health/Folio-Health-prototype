"use client"

import Link from "next/link"
import { format } from "date-fns"
import { Building2Icon, StethoscopeIcon, ScrollTextIcon, ArrowRightIcon } from "lucide-react"
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
import { EmptyState, ErrorState } from "@/components/common/empty-state"
import { ListSkeleton, StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { DonutChart, type DonutSlice } from "@/components/charts/donut-chart"
import { BarChart } from "@/components/charts/bar-chart"
import {
  usePlatformMetrics,
  useRecentActivity,
  type StatusBreakdown,
} from "../hooks/use-dashboard-metrics"

/** Only non-zero slices — a 0-value wedge renders as an invisible legend entry. */
function statusSlices(status: StatusBreakdown): DonutSlice[] {
  return [
    { label: "Active", value: status.active, color: "var(--chart-1)" },
    { label: "Deactivated", value: status.inactive, color: "var(--chart-4)" },
    { label: "Not recorded", value: status.unspecified, color: "var(--chart-3)" },
  ].filter((slice) => slice.value > 0)
}

/** Bars keep every category, including zeros — "0 deactivated" is a real answer. */
function statusBars(status: StatusBreakdown): Record<string, string | number>[] {
  return [
    { status: "Active", accounts: status.active },
    { status: "Deactivated", accounts: status.inactive },
    { status: "Not recorded", accounts: status.unspecified },
  ]
}

/**
 * The operator's dashboard.
 *
 * The platform plane runs the network, not the chart: this shows facilities,
 * the staff directory and the audit trail, and deliberately carries NO clinical
 * figures — no patient counts, encounters, appointments or lab orders. Per
 * architecture §7 the operator's clinical access is break-glass only, so a
 * patient count has no business on this screen even as a number.
 */
function PlatformDashboard() {
  const metrics = usePlatformMetrics()
  const activity = useRecentActivity(8)

  if (metrics.isError) {
    return (
      <ErrorState
        title="Could not load platform overview"
        description={
          metrics.error instanceof Error
            ? metrics.error.message
            : "The Folio server did not respond."
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
        <StatCardGridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/facilities" className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50">
            <StatCard label="Facilities" value={data.organizations} icon={Building2Icon} tone="amber" />
          </Link>
          <StatCard label="Staff accounts" value={data.practitioners} icon={StethoscopeIcon} />
          <StatCard
            label="Audit events"
            value={data.auditEvents}
            icon={ScrollTextIcon}
            tone="violet"
          />
        </div>
      )}

      {!metrics.isLoading && data && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Facilities by status</CardTitle>
              <CardDescription>Active vs deactivated tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={statusSlices(data.facilityStatus)}
                centerLabel="Facilities"
                centerValue={data.facilityStatus.total}
                size={150}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff accounts by status</CardTitle>
              <CardDescription>Across every facility on the platform</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <BarChart
                data={statusBars(data.accountStatus)}
                xKey="status"
                series={[{ key: "accounts", label: "Accounts" }]}
                height={200}
              />
              {data.accountStatus.unspecified > 0 && (
                <p className="text-xs text-muted-foreground">
                  {data.accountStatus.unspecified} account
                  {data.accountStatus.unspecified === 1 ? " has" : "s have"} no active flag
                  recorded. FHIR reads a missing flag as active, so these cannot be
                  distinguished from enabled accounts when offboarding staff.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>From the server audit trail</CardDescription>
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
            render={<Link href="/facilities" />}
          >
            Manage facilities
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardContent>
      </Card>

      <p className="max-w-2xl text-xs text-muted-foreground">
        This account administers the platform: facilities, staff identities and configuration.
        Clinical records belong to each facility and are not shown here.
      </p>
    </div>
  )
}

export { PlatformDashboard }
