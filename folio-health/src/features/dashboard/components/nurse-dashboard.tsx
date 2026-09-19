"use client"

import Link from "next/link"
import { ActivityIcon, ClipboardListIcon, PillIcon, UsersIcon } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton, StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { codeLabel, subjectLabel, useNurseDashboard } from "../hooks/use-role-dashboards"

/**
 * Nurse dashboard — real FHIR figures under the Nurse AccessPolicy. There is
 * no bed/ward-assignment data model yet, so "assigned patients" is honestly
 * represented by the facility's in-progress encounters rather than an invented
 * ward list; the medication panel lists real active prescriptions rather than
 * a fabricated MAR timetable.
 */
function NurseDashboard() {
  const { data, isLoading } = useNurseDashboard()

  return (
    <div className="flex flex-col gap-6">
      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Patients" value={data.patients ?? "—"} icon={UsersIcon} />
          <StatCard
            label="Active Encounters"
            value={data.activeEncounters ?? "—"}
            icon={ClipboardListIcon}
            tone="amber"
          />
          <StatCard
            label="Active Medications"
            value={data.activeMedications ?? "—"}
            icon={PillIcon}
            tone="violet"
          />
          <StatCard
            label="Vitals Recorded Today"
            value={data.vitalsToday ?? "—"}
            icon={ActivityIcon}
            tone="emerald"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Patients in Care</CardTitle>
            <CardDescription>Encounters currently in progress at your facility</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/nursing" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isLoading ? (
              <ListSkeleton />
            ) : data?.encounters === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Not available for your role.
              </p>
            ) : !data?.encounters?.length ? (
              <EmptyState
                icon={UsersIcon}
                title="No patients in care right now"
                description="In-progress encounters appear here as they are opened."
              />
            ) : (
              data.encounters.map((encounter) => (
                <div
                  key={encounter.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
                >
                  <PersonAvatar name={subjectLabel(encounter)} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-medium text-foreground">
                      {subjectLabel(encounter)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {encounter.type?.[0]?.text ??
                        encounter.type?.[0]?.coding?.[0]?.display ??
                        "Encounter"}
                    </p>
                  </div>
                  <StatusBadge status={encounter.status ?? "unknown"} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Prescriptions</CardTitle>
            <CardDescription>Latest active medication orders</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <ListSkeleton />
            ) : data?.medications === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Not available for your role.
              </p>
            ) : !data?.medications?.length ? (
              <EmptyState
                icon={PillIcon}
                title="No active prescriptions"
                description="Medication orders appear here once prescribed."
              />
            ) : (
              data.medications.map((medication) => (
                <div key={medication.id} className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm text-foreground">{subjectLabel(medication)}</p>
                    <p className="truncate text-xs text-muted-foreground">{codeLabel(medication)}</p>
                  </div>
                  <StatusBadge status={medication.status ?? "unknown"} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { NurseDashboard }
