import Link from "next/link"
import { UsersIcon, PillIcon, ActivityIcon, ListChecksIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { PATIENTS } from "@/lib/mock/patients"

const MEDICATION_TASKS = [
  { time: "08:00 AM", patient: PATIENTS[0], drug: "Amlodipine 5mg", status: "Done" },
  { time: "10:00 AM", patient: PATIENTS[1], drug: "Amoxicillin 500mg", status: "Done" },
  { time: "12:00 PM", patient: PATIENTS[2], drug: "Atorvastatin 20mg", status: "Pending" },
  { time: "02:00 PM", patient: PATIENTS[3], drug: "Pantoprazole 40mg", status: "Pending" },
]

function NurseDashboard() {
  const assigned = PATIENTS.slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Patients" value={assigned.length + 19} icon={UsersIcon} />
        <StatCard label="Tasks Pending" value={8} icon={ListChecksIcon} tone="amber" />
        <StatCard label="Medications Due" value={12} icon={PillIcon} tone="violet" />
        <StatCard label="Vitals Alerts" value={5} icon={ActivityIcon} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
            <CardDescription>Ward rounds for your current shift</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/nursing" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {assigned.map((patient, i) => (
              <div key={patient.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                <PersonAvatar name={patient.name} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{patient.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Room {201 + i}</p>
                </div>
                <StatusBadge status={i === 1 ? "Critical" : "Active"} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medication Schedule</CardTitle>
            <CardDescription>Today's MAR</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {MEDICATION_TASKS.map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{task.time}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm text-foreground">{task.patient?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{task.drug}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { NurseDashboard }
