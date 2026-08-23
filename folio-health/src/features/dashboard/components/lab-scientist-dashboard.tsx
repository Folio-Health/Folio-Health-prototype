"use client"

import Link from "next/link"
import { CheckCircle2Icon, ClockIcon, FileTextIcon, FlaskConicalIcon } from "lucide-react"
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
import { codeLabel, subjectLabel, useLabDashboard } from "../hooks/use-role-dashboards"

/**
 * Laboratory dashboard — real ServiceRequest / DiagnosticReport figures.
 * "Critical results" has no flagging model yet, so no such number is shown.
 */
function LabScientistDashboard() {
  const { data, isLoading } = useLabDashboard()

  return (
    <div className="flex flex-col gap-6">
      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pending Orders"
            value={data.pendingOrders ?? "—"}
            icon={ClockIcon}
            tone="amber"
          />
          <StatCard
            label="Reports Issued Today"
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
          <StatCard label="Critical Results" value="—" icon={FlaskConicalIcon} tone="red" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Queue</CardTitle>
          <CardDescription>Active lab orders awaiting processing</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/laboratory" />}>
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
              icon={FlaskConicalIcon}
              title="No active lab orders"
              description="Orders placed from the consultation workspace appear here."
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

export { LabScientistDashboard }
