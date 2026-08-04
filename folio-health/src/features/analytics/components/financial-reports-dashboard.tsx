"use client"

import { toast } from "sonner"
import { WalletIcon, ReceiptIcon, TrendingUpIcon, TriangleAlertIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { DataTable } from "@/components/tables/data-table"
import { TrendChart } from "@/components/charts/trend-chart"
import { AnalyticsModuleTabs } from "./analytics-module-tabs"
import { getReportColumns } from "./report-columns"
import { REVENUE_VS_EXPENSES, FINANCIAL_STATS, FINANCIAL_REPORTS, type ReportLineItem } from "@/lib/mock/analytics"

function FinancialReportsDashboard() {
  const columns = getReportColumns({
    onView: (report) => toast(`Opening ${report.name}`, { description: `${report.period} report` }),
    onDownload: (report: ReportLineItem) =>
      toast.success(`Downloading ${report.name}`, { description: `${report.period} report` }),
  })

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        description="Revenue, expenses, and finance report archive"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Analytics", href: "/analytics" },
          { label: "Financial Reports" },
        ]}
      />

      <AnalyticsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue (YTD)" value={FINANCIAL_STATS.totalRevenueYTDLabel} icon={WalletIcon} />
        <StatCard
          label="Total Expenses (YTD)"
          value={FINANCIAL_STATS.totalExpensesYTDLabel}
          icon={ReceiptIcon}
          tone="amber"
        />
        <StatCard
          label="Net Margin"
          value={`${FINANCIAL_STATS.netMarginPercent}%`}
          icon={TrendingUpIcon}
          tone="emerald"
        />
        <StatCard
          label="Outstanding Receivables"
          value={FINANCIAL_STATS.outstandingReceivablesLabel}
          icon={TriangleAlertIcon}
          tone="red"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Last 12 months (₦ millions)</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={REVENUE_VS_EXPENSES}
            xKey="month"
            type="line"
            series={[
              { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
              { key: "expenses", label: "Expenses", color: "var(--chart-4)" },
            ]}
            yFormatter={(v) => `₦${v}M`}
          />
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={FINANCIAL_REPORTS}
        emptyTitle="No financial reports"
        emptyDescription="Generated financial reports will appear here."
      />
    </div>
  )
}

export { FinancialReportsDashboard }
