"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { BarChart } from "@/components/charts/bar-chart"
import { TrendChart } from "@/components/charts/trend-chart"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { TOP_DIAGNOSES, CONDITION_MONTHLY_TREND, CONDITION_TREND_SERIES } from "@/lib/mock/analytics"

function DiseaseTrendsDashboard() {
  return (
    <div>
      <PageHeader
        title="Disease & Diagnosis Trends"
        description="Most frequent diagnoses and how leading conditions are trending"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Analytics", href: "/analytics" },
          { label: "Disease Trends" },
        ]}
      />

      <AnalyticsModuleTabs />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Diagnoses</CardTitle>
            <CardDescription>By recorded case count, year to date</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={TOP_DIAGNOSES}
              xKey="diagnosis"
              layout="horizontal"
              height={340}
              series={[{ key: "cases", label: "Cases", color: "var(--chart-3)" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leading Conditions Over Time</CardTitle>
            <CardDescription>Monthly case counts, top {CONDITION_TREND_SERIES.length} conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={CONDITION_MONTHLY_TREND}
              xKey="month"
              type="line"
              height={340}
              series={CONDITION_TREND_SERIES}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { DiseaseTrendsDashboard }
