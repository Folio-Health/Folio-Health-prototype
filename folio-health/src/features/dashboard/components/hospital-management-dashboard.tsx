import { BuildingIcon, BedDoubleIcon, UsersRoundIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/cards/stat-card"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { STAFF } from "@/lib/mock/staff"

const DEPT_PERFORMANCE = [
  { department: "Cardiology", patients: 210 },
  { department: "Pediatrics", patients: 185 },
  { department: "General Med.", patients: 260 },
  { department: "Orthopedics", patients: 140 },
  { department: "Oncology", patients: 96 },
]

const BED_OCCUPANCY = [
  { label: "Occupied", value: 168 },
  { label: "Available", value: 52 },
  { label: "Cleaning", value: 10 },
]

function HospitalManagementDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue (MTD)" value="N142.8M" icon={TrendingUpIcon} delta={{ value: 9, comparedTo: "last month" }} />
        <StatCard label="Bed Occupancy" value="76%" icon={BedDoubleIcon} tone="violet" />
        <StatCard label="Total Staff" value={STAFF.length} icon={UsersRoundIcon} tone="emerald" />
        <StatCard label="Active Departments" value={20} icon={BuildingIcon} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Patients served this month</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={DEPT_PERFORMANCE}
              xKey="department"
              layout="horizontal"
              series={[{ key: "patients", label: "Patients", color: "var(--chart-1)" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bed Occupancy</CardTitle>
            <CardDescription>Hospital-wide, 230 beds</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={BED_OCCUPANCY} centerLabel="Occupied" centerValue="76%" size={140} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { HospitalManagementDashboard }
