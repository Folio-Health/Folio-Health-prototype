"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Building2Icon, StethoscopeIcon, ScrollTextIcon } from "lucide-react"
import { cn } from "@/lib/utils"
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
import {
  ChartCardSkeleton,
  ListSkeleton,
  StatCardGridSkeleton,
} from "@/components/common/loading-skeletons"
import { DonutChart, type DonutSlice } from "@/components/charts/donut-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  useFacilityRegistrations,
  usePlatformMetrics,
  useRecentActivity,
  type Granularity,
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
  const [granularity, setGranularity] = useState<Granularity>("month")
  const metrics = usePlatformMetrics()
  const registrations = useFacilityRegistrations(granularity)
  const activity = useRecentActivity(6)

  if (metrics.isError) {
    return (
      <ErrorState
        title="Could not load platform overview"
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
            <CardContent className="flex flex-col gap-3">
              <DonutChart
                data={statusSlices(data.facilityStatus)}
                centerLabel="Facilities"
                centerValue={data.facilityStatus.total}
                size={150}
              />
              {data.accountStatus.unspecified > 0 && (
                <p className="text-xs text-muted-foreground">
                  {data.accountStatus.unspecified} of {data.accountStatus.total} staff accounts
                  have no active flag recorded. FHIR reads a missing flag as active, so a
                  deactivated account cannot be distinguished from an enabled one when
                  offboarding staff.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facility registrations</CardTitle>
              <CardDescription>
                New facilities onboarded per {granularity === "week" ? "week" : "month"}
              </CardDescription>
              <CardAction>
                <ToggleGroup
                  value={[granularity]}
                  onValueChange={(value) => {
                    const next = value[0]
                    if (next === "week" || next === "month") setGranularity(next)
                  }}
                >
                  <ToggleGroupItem value="week" className="h-7 px-2.5 text-xs">
                    Weekly
                  </ToggleGroupItem>
                  <ToggleGroupItem value="month" className="h-7 px-2.5 text-xs">
                    Monthly
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {registrations.isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <BarChart
                  data={registrations.data ?? []}
                  xKey="period"
                  series={[{ key: "facilities", label: "Facilities registered" }]}
                  height={200}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Registration date is the record&apos;s creation time. A facility edited after
                onboarding counts in the period it was edited.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
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
        <CardContent>
          {activity.isLoading ? (
            <ListSkeleton />
          ) : activity.data?.length ? (
            // One line per event, time right-aligned on its own column so the
            // timestamps stack and stay scannable.
            <ul className="divide-y divide-border">
              {activity.data.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 py-1.5 text-xs">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      item.outcome && item.outcome !== "0" ? "bg-destructive" : "bg-primary"
                    )}
                  />
                  <span className="truncate text-foreground">{item.action}</span>
                  <span className="truncate text-muted-foreground">{item.who}</span>
                  <span className="ml-auto shrink-0 font-mono text-muted-foreground/70">
                    {item.when ? format(new Date(item.when), "d MMM HH:mm") : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No recorded activity" description="The audit trail is empty." />
          )}
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
