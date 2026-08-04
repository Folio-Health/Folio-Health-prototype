"use client"

import { WalletIcon, TrendingUpIcon, UsersIcon, PercentIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { MONTHLY_REVENUE, REVENUE_BY_DEPARTMENT, REVENUE_STATS } from "@/lib/mock/analytics"

function RevenueDashboard() {
  return (
    <div>
      <PageHeader
        title="Revenue Dashboard"
        description="Hospitalwide revenue performance and trends"
        breadcrumbs={[{ label: "Insights" }, { label: "Analytics", href: "/analytics" }, { label: "Revenue" }]}
      />

      <AnalyticsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue (MTD)" value={REVENUE_STATS.totalRevenueMTDLabel} icon={WalletIcon} />
        <StatCard
          label="Revenue YTD"
          value={REVENUE_STATS.revenueYTDLabel}
          icon={TrendingUpIcon}
          tone="emerald"
        />
        <StatCard
          label="Avg Revenue / Patient"
          value={REVENUE_STATS.avgRevenuePerPatientLabel}
          icon={UsersIcon}
          tone="violet"
        />
        <StatCard
          label="Growth"
          value={`${REVENUE_STATS.growthPercent > 0 ? "+" : ""}${REVENUE_STATS.growthPercent}%`}
          icon={PercentIcon}
          tone="amber"
          delta={{ value: REVENUE_STATS.growthPercent, comparedTo: "last month" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Last 12 months (₦ millions)</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={MONTHLY_REVENUE}
              xKey="month"
              series={[{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }]}
              yFormatter={(v) => `₦${v}M`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Department</CardTitle>
            <CardDescription>Year to date (₦ millions)</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={REVENUE_BY_DEPARTMENT}
              xKey="department"
              layout="horizontal"
              series={[{ key: "revenue", label: "Revenue", color: "var(--chart-2)" }]}
              yFormatter={(v) => `₦${v}M`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { RevenueDashboard }
