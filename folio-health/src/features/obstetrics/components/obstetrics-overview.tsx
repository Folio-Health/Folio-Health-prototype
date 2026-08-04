"use client"

import Link from "next/link"
import { format } from "date-fns"
import { HeartPulseIcon, TriangleAlertIcon, BabyIcon, CalendarClockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { ObstetricsModuleTabs } from "./obstetrics-module-tabs"
import { PREGNANCIES, ANTENATAL_VISITS, DELIVERY_RECORDS, POSTNATAL_RECORDS } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"

function ObstetricsOverview() {
  const highRisk = PREGNANCIES.filter((p) => p.riskLevel === "High").length
  const postnatalDue = POSTNATAL_RECORDS.filter((p) => p.status === "Scheduled").length

  const upcomingVisits = [...ANTENATAL_VISITS]
    .sort((a, b) => a.nextVisitDate.localeCompare(b.nextVisitDate))
    .slice(0, 5)

  const recentDeliveries = DELIVERY_RECORDS.slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Obstetrics"
        description="Pregnancy, antenatal, delivery, and postnatal care overview"
        breadcrumbs={[{ label: "Clinical" }, { label: "Obstetrics" }]}
      />

      <ObstetricsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Currently Pregnant" value={PREGNANCIES.length} icon={HeartPulseIcon} />
        <StatCard label="High Risk Pregnancies" value={highRisk} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Deliveries Recorded" value={DELIVERY_RECORDS.length} icon={BabyIcon} tone="violet" />
        <StatCard label="Postnatal Follow-ups Due" value={postnatalDue} icon={CalendarClockIcon} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Antenatal Visits</CardTitle>
            <CardDescription>Next scheduled checkups</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/obstetrics/antenatal" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {upcomingVisits.length === 0 ? (
              <EmptyState title="No antenatal visits scheduled" />
            ) : (
              upcomingVisits.map((visit) => {
                const patient = getPatientById(visit.patientId)
                return (
                  <div key={visit.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                    <PersonAvatar name={patient?.name ?? "Patient"} seed={patient?.avatarSeed} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{patient?.name ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">Week {visit.gestationalWeek}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(visit.nextVisitDate), "MMM d")}
                    </span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Latest recorded births</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/obstetrics/delivery" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentDeliveries.length === 0 ? (
              <EmptyState title="No deliveries recorded yet" />
            ) : (
              recentDeliveries.map((delivery) => {
                const patient = getPatientById(delivery.patientId)
                const doctor = getStaffById(delivery.attendingDoctorId)
                return (
                  <div key={delivery.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                    <PersonAvatar name={patient?.name ?? "Patient"} seed={patient?.avatarSeed} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{patient?.name ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {delivery.type} &middot; Dr. {doctor?.name.replace(/^Dr\.\s*/, "") ?? "Unknown"}
                      </p>
                    </div>
                    <StatusBadge
                      status={delivery.type}
                      tone={delivery.type === "C-Section" ? "violet" : "blue"}
                    />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { ObstetricsOverview }
