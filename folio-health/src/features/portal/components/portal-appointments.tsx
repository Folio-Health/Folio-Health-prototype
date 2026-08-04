"use client"

import { format } from "date-fns"
import { CalendarDaysIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { BookAppointmentDialog } from "./book-appointment-dialog"
import { getPortalUpcomingAppointments, getPortalPastAppointments } from "@/lib/mock/portal"
import { getStaffById } from "@/lib/mock/staff"
import type { Appointment } from "@/types/core"

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const doctor = getStaffById(appointment.doctorId)

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <PersonAvatar name={doctor?.name ?? "Doctor"} seed={doctor?.avatarSeed} />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{doctor?.name ?? "Unassigned Doctor"}</span>
          <span className="text-sm text-muted-foreground">{appointment.reason}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(appointment.startTime), "EEEE, MMM d, yyyy 'at' h:mm a")} &middot; {appointment.type}
          </span>
        </div>
      </div>
      <StatusBadge status={appointment.status} />
    </div>
  )
}

function PortalAppointments() {
  const upcoming = getPortalUpcomingAppointments()
  const past = getPortalPastAppointments()

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="View your upcoming visits and past appointment history"
        actions={<BookAppointmentDialog />}
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardContent>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarDaysIcon}
                  title="No upcoming appointments"
                  description="Book a visit with your care team whenever you're ready."
                  action={<BookAppointmentDialog />}
                />
              ) : (
                upcoming.map((a) => <AppointmentRow key={a.id} appointment={a} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Card>
            <CardContent>
              {past.length === 0 ? (
                <EmptyState
                  icon={CalendarDaysIcon}
                  title="No past appointments"
                  description="Your visit history will appear here after your first appointment."
                />
              ) : (
                past.map((a) => <AppointmentRow key={a.id} appointment={a} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { PortalAppointments }
