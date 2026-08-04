"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { BarChart } from "@/components/charts/bar-chart"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { departmentPerformanceColumns } from "./department-performance-columns"
import { DEPARTMENT_PERFORMANCE } from "@/lib/mock/analytics"

function DepartmentPerformanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Department Performance"
        description="Compare patient volume, revenue, and service quality across departments"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Analytics", href: "/analytics" },
          { label: "Department Performance" },
        ]}
      />

      <AnalyticsModuleTabs />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Patients Served by Department</CardTitle>
          <CardDescription>Year to date</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={DEPARTMENT_PERFORMANCE}
            xKey="department"
            layout="horizontal"
            height={320}
            series={[{ key: "patientsSeen", label: "Patients Seen", color: "var(--chart-1)" }]}
          />
        </CardContent>
      </Card>

      <DataTable
        columns={departmentPerformanceColumns}
        data={DEPARTMENT_PERFORMANCE}
        emptyTitle="No department data"
        emptyDescription="Performance metrics will appear here once data is available."
      />
    </div>
  )
}

export { DepartmentPerformanceDashboard }
