"use client"

import { toast } from "sonner"
import { CalendarClockIcon, HeartPulseIcon, ShieldAlertIcon, SmileIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { DataTable } from "@/components/tables/data-table"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { getReportColumns } from "./report-columns"
import { CLINICAL_STATS, CLINICAL_REPORTS, type ReportLineItem } from "@/lib/mock/analytics"

function ClinicalReportsDashboard() {
  const columns = getReportColumns({
    onView: (report) => toast(`Opening ${report.name}`, { description: `${report.period} report` }),
    onDownload: (report: ReportLineItem) =>
      toast.success(`Downloading ${report.name}`, { description: `${report.period} report` }),
  })

  return (
    <div>
      <PageHeader
        title="Clinical Reports"
        description="Clinical quality and outcomes reporting"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Analytics", href: "/analytics" },
          { label: "Clinical Reports" },
        ]}
      />

      <AnalyticsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Avg Length of Stay"
          value={`${CLINICAL_STATS.avgLengthOfStay} days`}
          icon={CalendarClockIcon}
        />
        <StatCard
          label="Mortality Rate"
          value={`${CLINICAL_STATS.mortalityRate}%`}
          icon={HeartPulseIcon}
          tone="red"
          delta={{ value: 0.3, isGoodWhenUp: false, comparedTo: "last quarter" }}
        />
        <StatCard
          label="Infection Rate"
          value={`${CLINICAL_STATS.infectionRate}%`}
          icon={ShieldAlertIcon}
          tone="amber"
          delta={{ value: 0.5, isGoodWhenUp: false, comparedTo: "last quarter" }}
        />
        <StatCard
          label="Patient Satisfaction"
          value={`${CLINICAL_STATS.patientSatisfaction} / 5`}
          icon={SmileIcon}
          tone="emerald"
        />
      </div>

      <DataTable
        columns={columns}
        data={CLINICAL_REPORTS}
        emptyTitle="No clinical reports"
        emptyDescription="Generated clinical reports will appear here."
      />
    </div>
  )
}

export { ClinicalReportsDashboard }
