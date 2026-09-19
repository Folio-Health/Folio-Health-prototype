"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ReceiptIcon, ShieldCheckIcon, TrendingUpIcon, WalletIcon } from "lucide-react"
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
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton, StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { subjectLabel, useBillingDashboard } from "../hooks/use-role-dashboards"

/**
 * Billing/Cashier dashboard — real Claim / Coverage figures from the server.
 * There is no revenue ledger data model yet, so no revenue amounts or trends
 * are shown; claims are the billing facts that actually exist.
 */
function AccountantDashboard() {
  const { data, isLoading } = useBillingDashboard()

  return (
    <div className="flex flex-col gap-6">
      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Claims" value={data.claims ?? "—"} icon={ReceiptIcon} />
          <StatCard
            label="Active Claims"
            value={data.claimsActive ?? "—"}
            icon={WalletIcon}
            tone="amber"
          />
          <StatCard
            label="Coverage Records"
            value={data.coverage ?? "—"}
            icon={ShieldCheckIcon}
            tone="violet"
          />
          <StatCard label="Revenue (MTD)" value="—" icon={TrendingUpIcon} tone="emerald" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Latest claims recorded at your facility</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/billing" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <ListSkeleton />
            ) : data?.recentClaims === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Not available for your role.
              </p>
            ) : !data?.recentClaims?.length ? (
              <EmptyState
                icon={ReceiptIcon}
                title="No claims recorded yet"
                description="Claims appear here as they are created from billing."
              />
            ) : (
              data.recentClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-sm font-medium text-foreground">
                      {subjectLabel({ subject: claim.patient })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {claim.created ? format(new Date(claim.created), "d MMM yyyy") : "No date"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {claim.total?.value != null
                        ? `${claim.total.currency ?? ""} ${claim.total.value.toLocaleString()}`
                        : "—"}
                    </span>
                    <StatusBadge status={claim.status ?? "unknown"} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Month over month</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={TrendingUpIcon}
              title="No revenue ledger yet"
              description="Payments and receipts aren't backed by a real ledger yet — the trend will appear here once they are."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { AccountantDashboard }
