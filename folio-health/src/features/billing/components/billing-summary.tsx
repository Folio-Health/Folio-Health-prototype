"use client"

import { useMemo } from "react"
import { ReceiptIcon, WalletIcon, TriangleAlertIcon, TrendingUpIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { BillingModuleTabs } from "./billing-module-tabs"
import { INVOICES, PAYMENTS, formatNaira } from "@/lib/mock/billing"

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function buildRevenueTrend(months: number) {
  const now = new Date()
  const buckets: { key: string; month: string; revenue: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_LABELS[d.getMonth()], revenue: 0 })
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  for (const payment of PAYMENTS) {
    const d = new Date(payment.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = byKey.get(key)
    if (bucket) bucket.revenue += payment.amount
  }
  return buckets.map((b) => ({ month: b.month, revenue: Math.round((b.revenue / 1_000_000) * 100) / 100 }))
}

function BillingSummary() {
  const revenueTrend = useMemo(() => buildRevenueTrend(6), [])

  const totalRevenue = PAYMENTS.reduce((sum, p) => sum + p.amount, 0)
  const totalInvoiced = INVOICES.reduce((sum, i) => sum + i.amount, 0)
  const totalOutstanding = INVOICES.reduce((sum, i) => sum + i.balance, 0)
  const collectionRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0

  const byMethod = (["Cash", "Card", "Transfer", "Insurance"] as const).map((m) => ({
    label: m,
    value: PAYMENTS.filter((p) => p.method === m).reduce((sum, p) => sum + p.amount, 0),
  }))

  const departmentTotals = new Map<string, number>()
  for (const invoice of INVOICES) {
    departmentTotals.set(invoice.department, (departmentTotals.get(invoice.department) ?? 0) + invoice.amount)
  }
  const byDepartment = Array.from(departmentTotals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Financial Summary"
        description="Revenue performance and collection breakdown"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Billing", href: "/billing" }, { label: "Summary" }]}
      />

      <BillingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Invoiced" value={formatNaira(totalInvoiced)} icon={ReceiptIcon} />
        <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} icon={WalletIcon} tone="emerald" />
        <StatCard label="Outstanding" value={formatNaira(totalOutstanding)} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} icon={TrendingUpIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months (₦ millions)</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={revenueTrend}
              xKey="month"
              series={[{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }]}
              yFormatter={(v) => `₦${v}M`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Method</CardTitle>
            <CardDescription>Share of total collections</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={byMethod} centerLabel="Collected" centerValue={formatNaira(totalRevenue)} size={140} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Department</CardTitle>
            <CardDescription>Top billing departments by invoiced amount</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byDepartment.map((dept) => {
              const max = byDepartment[0]?.value || 1
              const pct = Math.round((dept.value / max) * 100)
              return (
                <div key={dept.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{dept.label}</span>
                    <span className="font-medium tabular-nums text-foreground">{formatNaira(dept.value)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { BillingSummary }
