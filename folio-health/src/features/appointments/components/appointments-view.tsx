"use client"

import Link from "next/link"
import { CalendarClockIcon, ListIcon, TableIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { NewAppointmentDialog } from "./new-appointment-dialog"
import { CalendarView } from "./calendar-view"
import { AppointmentsListView } from "./appointments-list-view"
import { AppointmentsTableView } from "./appointments-table-view"

function AppointmentsView() {
  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Manage bookings across every department"
        breadcrumbs={[{ label: "Front Desk" }, { label: "Appointments" }]}
        actions={
          <>
            <Button variant="outline" render={<Link href="/appointments/waiting-room" />}>
              Waiting Room
            </Button>
            <NewAppointmentDialog />
          </>
        }
      />

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarClockIcon />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListIcon />
            List View
          </TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon />
            Table View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <CalendarView />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <AppointmentsListView />
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <AppointmentsTableView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AppointmentsView }
