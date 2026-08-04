import Link from "next/link"
import { ScanIcon, ClockIcon, FileCheck2Icon, TriangleAlertIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { PATIENTS } from "@/lib/mock/patients"

const STUDIES = [
  { id: "RAD-0001", patient: PATIENTS[0], modality: "Chest X-ray", status: "Pending" },
  { id: "RAD-0002", patient: PATIENTS[5], modality: "Brain MRI", status: "In Progress" },
  { id: "RAD-0003", patient: PATIENTS[6], modality: "Abdominal CT", status: "Completed" },
  { id: "RAD-0004", patient: PATIENTS[7], modality: "Obstetric Ultrasound", status: "Pending" },
]

function RadiologistDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Studies" value={17} icon={ClockIcon} tone="amber" />
        <StatCard label="In Progress" value={6} icon={ScanIcon} tone="violet" />
        <StatCard label="Reports Filed Today" value={21} icon={FileCheck2Icon} tone="emerald" />
        <StatCard label="Critical Findings" value={2} icon={TriangleAlertIcon} tone="red" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Imaging Queue</CardTitle>
          <CardDescription>Studies awaiting capture or reporting</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/radiology" />}>
              View all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {STUDIES.map((row) => (
            <div key={row.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{row.id}</span>
              <PersonAvatar name={row.patient!.name} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium text-foreground">{row.patient?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.modality}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export { RadiologistDashboard }
