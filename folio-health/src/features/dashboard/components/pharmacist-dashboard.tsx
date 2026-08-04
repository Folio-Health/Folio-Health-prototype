import Link from "next/link"
import { PillIcon, PackageXIcon, CheckCircle2Icon, CalendarClockIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { PATIENTS } from "@/lib/mock/patients"

const PRESCRIPTIONS = [
  { id: "RX-0001", patient: PATIENTS[0], drug: "Amoxicillin 500mg", status: "To Dispense" },
  { id: "RX-0002", patient: PATIENTS[1], drug: "Atorvastatin 20mg", status: "Dispensed" },
  { id: "RX-0003", patient: PATIENTS[2], drug: "Metformin 500mg", status: "To Dispense" },
]

const LOW_STOCK = [
  { name: "Amoxicillin 500mg", remaining: 12, unit: "capsules" },
  { name: "Paracetamol 500mg", remaining: 34, unit: "tablets" },
  { name: "Insulin Glargine", remaining: 5, unit: "vials" },
]

function PharmacistDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="To Dispense" value={23} icon={PillIcon} tone="amber" />
        <StatCard label="Dispensed Today" value={57} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Low Stock Items" value={LOW_STOCK.length} icon={PackageXIcon} tone="red" />
        <StatCard label="Expiring This Month" value={9} icon={CalendarClockIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prescription Queue</CardTitle>
            <CardDescription>Awaiting dispensing</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/pharmacy" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {PRESCRIPTIONS.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{row.id}</span>
                <PersonAvatar name={row.patient!.name} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{row.patient?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.drug}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Below reorder level</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {LOW_STOCK.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <p className="text-sm text-foreground">{item.name}</p>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {item.remaining} {item.unit}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { PharmacistDashboard }
