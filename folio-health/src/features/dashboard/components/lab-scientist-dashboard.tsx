import Link from "next/link"
import { FlaskConicalIcon, ClockIcon, CheckCircle2Icon, TriangleAlertIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { PATIENTS } from "@/lib/mock/patients"

const TEST_QUEUE = [
  { id: "LAB-0001", patient: PATIENTS[0], test: "Complete Blood Count (CBC)", status: "Pending" },
  { id: "LAB-0002", patient: PATIENTS[1], test: "Liver Function Test (LFT)", status: "In Progress" },
  { id: "LAB-0003", patient: PATIENTS[2], test: "Fasting Blood Sugar", status: "Completed" },
  { id: "LAB-0004", patient: PATIENTS[3], test: "Lipid Profile", status: "Pending" },
  { id: "LAB-0005", patient: PATIENTS[4], test: "Kidney Function Test (KFT)", status: "Critical" },
]

function LabScientistDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Tests" value={45} icon={ClockIcon} tone="amber" />
        <StatCard label="In Progress" value={12} icon={FlaskConicalIcon} tone="violet" />
        <StatCard label="Completed Today" value={38} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Critical Results" value={3} icon={TriangleAlertIcon} tone="red" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Queue</CardTitle>
          <CardDescription>Samples awaiting processing or review</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/laboratory" />}>
              View all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {TEST_QUEUE.map((row) => (
            <div key={row.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{row.id}</span>
              <PersonAvatar name={row.patient!.name} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium text-foreground">{row.patient?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.test}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export { LabScientistDashboard }
