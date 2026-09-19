"use client"

import Link from "next/link"
import { CheckCircle2Icon, ClockIcon, FileTextIcon, ScanIcon } from "lucide-react"
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
import { IMAGING_CATEGORY } from "@/features/clinical/hooks/use-clinical"
import { codeLabel, subjectLabel, useLabDashboard } from "../hooks/use-role-dashboards"

/**
 * Radiographer dashboard (Implementation Manuscript §3, §4.5).
 *
 * §4.5 makes imaging "parallel structure to lab" — a separate dashboard to
 * work the imaging queue from, the counterpart of the lab scientist's order
 * queue. So this is deliberately the same shape as LabScientistDashboard,
 * scoped to IMAGING_CATEGORY rather than laboratory orders.
 *
 * Every figure is a real count from the FHIR server, and a `null` means this
 * role's AccessPolicy does not grant the resource — rendered as a dash, never
 * as an invented number.
 */
function RadiographerDashboard() {
  const { data, isLoading } = useLabDashboard(IMAGING_CATEGORY)

  return (
    <div className="flex flex-col gap-6">
      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pending Studies"
            value={data.pendingOrders ?? "—"}
            icon={ClockIcon}
            tone="amber"
          />
          <StatCard
            label="Reports Filed Today"
            value={data.reportsToday ?? "—"}
            icon={CheckCircle2Icon}
            tone="emerald"
          />
          <StatCard
            label="Reports Total"
            value={data.reportsTotal ?? "—"}
            icon={FileTextIcon}
            tone="violet"
          />
          {/* No criticality model exists for imaging findings yet, so no
              number is shown rather than a made-up one. */}
          <StatCard label="Critical Findings" value="—" icon={ScanIcon} tone="red" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Imaging Queue</CardTitle>
          <CardDescription>Studies awaiting capture or reporting</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/radiology" />}>
              View all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {isLoading ? (
            <ListSkeleton />
          ) : data?.orders === null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Not available for your role.
            </p>
          ) : !data?.orders?.length ? (
            <EmptyState
              icon={ScanIcon}
              title="No active imaging requests"
              description="Imaging ordered from the consultation workspace appears here."
            />
          ) : (
            data.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
              >
                <PersonAvatar name={subjectLabel(order)} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">
                    {subjectLabel(order)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{codeLabel(order)}</p>
                </div>
                <StatusBadge status={order.status ?? "unknown"} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { RadiographerDashboard }
