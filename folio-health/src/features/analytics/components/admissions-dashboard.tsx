"use client"

import { BedDoubleIcon, CalendarClockIcon, RotateCcwIcon, PercentIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { MONTHLY_ADMISSIONS, ADMISSIONS_BY_DEPARTMENT, ADMISSIONS_STATS } from "@/lib/mock/analytics"

function AdmissionsDashboard() {
  const totalDept = ADMISSIONS_BY_DEPARTMENT.reduce((sum, d) => sum + d.value, 0)

  return (
    <div>
      <PageHeader
        title="Admissions Analytics"
        description="Inpatient admissions volume, stay duration, and bed utilization"
        breadcrumbs={[{ label: "Insights" }, { label: "Analytics", href: "/analytics" }, { label: "Admissions" }]}
      />

      <AnalyticsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Admissions" value={ADMISSIONS_STATS.totalAdmissions} icon={BedDoubleIcon} />
        <StatCard
          label="Avg Length of Stay"
          value={`${ADMISSIONS_STATS.avgLengthOfStay} days`}
          icon={CalendarClockIcon}
          tone="violet"
        />
        <StatCard
          label="Readmission Rate"
          value={`${ADMISSIONS_STATS.readmissionRate}%`}
          icon={RotateCcwIcon}
          tone="amber"
          delta={{ value: 1.2, isGoodWhenUp: false, comparedTo: "last quarter" }}
        />
        <StatCard
          label="Bed Occupancy"
          value={`${ADMISSIONS_STATS.bedOccupancy}%`}
          icon={PercentIcon}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Admissions Trend</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={MONTHLY_ADMISSIONS}
              xKey="month"
              series={[{ key: "admissions", label: "Admissions", color: "var(--chart-1)" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admissions by Department</CardTitle>
            <CardDescription>Share of total inpatient volume</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={ADMISSIONS_BY_DEPARTMENT} centerLabel="Total" centerValue={totalDept} size={140} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { AdmissionsDashboard }
