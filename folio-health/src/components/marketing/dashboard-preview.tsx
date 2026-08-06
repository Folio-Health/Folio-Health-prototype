import {
  UsersIcon,
  CalendarDaysIcon,
  BedDoubleIcon,
  TrendingUpIcon,
} from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { DonutChart } from "@/components/charts/donut-chart"

const WEEKLY_VISITS = [
  { day: "Mon", visits: 92 },
  { day: "Tue", visits: 118 },
  { day: "Wed", visits: 104 },
  { day: "Thu", visits: 132 },
  { day: "Fri", visits: 121 },
  { day: "Sat", visits: 88 },
  { day: "Sun", visits: 64 },
]

const DEPARTMENT_LOAD = [
  { label: "Outpatient", value: 46 },
  { label: "Inpatient", value: 23 },
  { label: "Emergency", value: 15 },
  { label: "Surgery", value: 10 },
  { label: "Others", value: 6 },
]

/**
 * A real, live-rendered slice of the product (StatCard/TrendChart/DonutChart —
 * the same components the app itself uses) framed as a browser-chrome preview,
 * instead of a static screenshot that goes stale the moment the UI changes.
 */
function DashboardPreview() {
  return (
    <div className="@container overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
          app.foliohealth.example/dashboard
        </span>
      </div>

      <div className="flex flex-col gap-3 p-3 @sm:gap-4 @sm:p-4 @lg:p-5">
        <div className="grid grid-cols-2 gap-2.5 @3xl:grid-cols-4 @3xl:gap-3">
          <StatCard label="Today's Patients" value={128} icon={UsersIcon} delta={{ value: 12, comparedTo: "yesterday" }} />
          <StatCard label="Appointments" value={86} icon={CalendarDaysIcon} tone="violet" delta={{ value: 8, comparedTo: "yesterday" }} />
          <StatCard label="Admissions" value={24} icon={BedDoubleIcon} tone="emerald" delta={{ value: -4, comparedTo: "yesterday" }} />
          <StatCard label="Revenue (MTD)" value="₦12.4M" icon={TrendingUpIcon} tone="amber" delta={{ value: 9, comparedTo: "last month" }} />
        </div>

        <div className="grid grid-cols-1 gap-2.5 @lg:grid-cols-3 @lg:gap-3">
          <div className="rounded-xl border border-border p-3 @lg:col-span-2">
            <p className="mb-2 text-sm font-medium text-foreground">Patient Visits This Week</p>
            <TrendChart
              data={WEEKLY_VISITS}
              xKey="day"
              height={130}
              series={[{ key: "visits", label: "Visits", color: "var(--chart-1)" }]}
            />
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="mb-2 text-sm font-medium text-foreground">Department Load</p>
            <DonutChart data={DEPARTMENT_LOAD} centerLabel="Total" centerValue={152} size={90} />
          </div>
        </div>
      </div>
    </div>
  )
}

export { DashboardPreview }
