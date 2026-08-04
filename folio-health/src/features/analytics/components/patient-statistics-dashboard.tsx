"use client"

import { UsersIcon, UserPlusIcon, CakeIcon, VenusAndMarsIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { DonutChart } from "@/components/charts/donut-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { PATIENT_STATS, GENDER_DISTRIBUTION, AGE_GROUP_DISTRIBUTION } from "@/lib/mock/analytics"

function PatientStatisticsDashboard() {
  return (
    <div>
      <PageHeader
        title="Patient Statistics"
        description="Demographic breakdown of the active patient population"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Analytics", href: "/analytics" },
          { label: "Patient Statistics" },
        ]}
      />

      <AnalyticsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Patients" value={PATIENT_STATS.totalPatients} icon={UsersIcon} />
        <StatCard
          label="New This Month"
          value={PATIENT_STATS.newThisMonth}
          icon={UserPlusIcon}
          tone="emerald"
          delta={{ value: 8, comparedTo: "last month" }}
        />
        <StatCard label="Avg Age" value={`${PATIENT_STATS.avgAge} yrs`} icon={CakeIcon} tone="violet" />
        <StatCard
          label="Gender Ratio (M:F)"
          value={PATIENT_STATS.genderRatioLabel}
          icon={VenusAndMarsIcon}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Across all registered patients</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={GENDER_DISTRIBUTION}
              centerLabel="Patients"
              centerValue={PATIENT_STATS.totalPatients}
              size={140}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Group Distribution</CardTitle>
            <CardDescription>Number of patients per age bracket</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={AGE_GROUP_DISTRIBUTION}
              xKey="ageGroup"
              series={[{ key: "count", label: "Patients", color: "var(--chart-2)" }]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { PatientStatisticsDashboard }
