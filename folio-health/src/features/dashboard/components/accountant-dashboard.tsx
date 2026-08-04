import Link from "next/link"
import { ReceiptIcon, WalletIcon, TriangleAlertIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { StatusBadge } from "@/components/common/status-badge"
import { PATIENTS } from "@/lib/mock/patients"

const REVENUE_TREND = [
  { month: "Jan", revenue: 8.4 },
  { month: "Feb", revenue: 9.1 },
  { month: "Mar", revenue: 8.8 },
  { month: "Apr", revenue: 10.2 },
  { month: "May", revenue: 11.6 },
  { month: "Jun", revenue: 12.45 },
]

const OUTSTANDING = [
  { id: "INV-0032", patient: PATIENTS[2], amount: "N45,000", status: "Overdue" },
  { id: "INV-0041", patient: PATIENTS[3], amount: "N18,500", status: "Partial" },
  { id: "INV-0055", patient: PATIENTS[4], amount: "N62,000", status: "Overdue" },
]

function AccountantDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Invoices" value={250} icon={ReceiptIcon} />
        <StatCard label="Paid Invoices" value={180} icon={WalletIcon} tone="emerald" />
        <StatCard label="Outstanding" value={70} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Total Revenue (MTD)" value="N12.45M" icon={TrendingUpIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months (₦ millions)</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={REVENUE_TREND}
              xKey="month"
              series={[{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }]}
              yFormatter={(v) => `₦${v}M`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Bills</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/billing/outstanding" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {OUTSTANDING.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{row.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">{row.id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-foreground">{row.amount}</span>
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { AccountantDashboard }
