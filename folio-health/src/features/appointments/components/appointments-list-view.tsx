"use client"

import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

function AppointmentsListView() {
  const grouped = APPOINTMENTS.slice(0, 60).reduce<Record<string, typeof APPOINTMENTS>>((acc, apt) => {
    acc[apt.date] = acc[apt.date] ? [...acc[apt.date], apt] : [apt]
    return acc
  }, {})
  const dates = Object.keys(grouped).sort()

  if (dates.length === 0) {
    return <EmptyState title="No appointments" description="No appointments have been scheduled yet." />
  }

  return (
    <div className="flex flex-col gap-5">
      {dates.map((date) => (
        <div key={date} className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {format(new Date(date), "EEEE, MMMM d, yyyy")}
          </p>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {grouped[date].map((apt) => {
                const patient = getPatientById(apt.patientId)
                const doctor = getStaffById(apt.doctorId)
                if (!patient || !doctor) return null
                return (
                  <div key={apt.id} className="flex items-center gap-4 px-4 py-3 first:pt-4 last:pb-4">
                    <span className="w-20 shrink-0 text-sm font-medium text-muted-foreground">
                      {format(new Date(apt.startTime), "h:mm a")}
                    </span>
                    <PersonAvatar name={patient.name} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{patient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {apt.reason} &middot; {doctor.name}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">{apt.type}</span>
                    <StatusBadge status={apt.status} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

export { AppointmentsListView }
