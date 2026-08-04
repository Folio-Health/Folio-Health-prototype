"use client"

import { useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar"
import { format, getDay, parse, startOfWeek } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/rbc-overrides.css"
import { Card, CardContent } from "@/components/ui/card"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

const locales = { "en-US": enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "var(--chart-1)",
  "Checked In": "var(--chart-2)",
  "In Progress": "var(--chart-3)",
  Completed: "var(--status-good)",
  Cancelled: "var(--status-critical)",
  "No Show": "var(--status-serious)",
}

function CalendarView() {
  const [view, setView] = useState<View>("week")
  const [date, setDate] = useState(new Date())

  const events = useMemo(
    () =>
      APPOINTMENTS.map((apt) => {
        const patient = getPatientById(apt.patientId)
        const doctor = getStaffById(apt.doctorId)
        return {
          id: apt.id,
          title: `${patient?.name ?? "Unknown"}, ${doctor?.name ?? ""}`,
          start: new Date(apt.startTime),
          end: new Date(apt.endTime),
          status: apt.status,
        }
      }),
    []
  )

  return (
    <Card>
      <CardContent>
        <div style={{ height: 640 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "week", "day", "agenda"]}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: STATUS_COLORS[event.status] ?? "var(--chart-1)",
              },
            })}
            popup
          />
        </div>
      </CardContent>
    </Card>
  )
}

export { CalendarView }
