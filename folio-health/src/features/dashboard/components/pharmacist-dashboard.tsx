"use client"

import Link from "next/link"
import { CheckCircle2Icon, PackageXIcon, PillIcon, ReceiptTextIcon } from "lucide-react"
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
import { codeLabel, subjectLabel, usePharmacyDashboard } from "../hooks/use-role-dashboards"

/**
 * Pharmacist dashboard — real MedicationRequest / MedicationDispense figures.
 * Stock levels and expiry have no inventory data model yet, so that panel says
 * so instead of listing invented drugs.
 */
function PharmacistDashboard() {
  const { data, isLoading } = usePharmacyDashboard()

  return (
    <div className="flex flex-col gap-6">
      {isLoading || !data ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="To Dispense" value={data.toDispense ?? "—"} icon={PillIcon} tone="amber" />
          <StatCard
            label="Dispensed Today"
            value={data.dispensedToday ?? "—"}
            icon={CheckCircle2Icon}
            tone="emerald"
          />
          <StatCard
            label="Dispenses Recorded"
            value={data.dispensedTotal ?? "—"}
            icon={ReceiptTextIcon}
            tone="violet"
          />
          <StatCard label="Low Stock Items" value="—" icon={PackageXIcon} tone="red" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prescription Queue</CardTitle>
            <CardDescription>Active prescriptions awaiting dispensing</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/pharmacy" />}>
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isLoading ? (
              <ListSkeleton />
            ) : data?.prescriptions === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Not available for your role.
              </p>
            ) : !data?.prescriptions?.length ? (
              <EmptyState
                icon={PillIcon}
                title="No prescriptions waiting"
                description="Active medication orders appear here once prescribed."
              />
            ) : (
              data.prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
                >
                  <PersonAvatar name={subjectLabel(prescription)} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-medium text-foreground">
                      {subjectLabel(prescription)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {codeLabel(prescription)}
                    </p>
                  </div>
                  <StatusBadge status={prescription.status ?? "unknown"} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PackageXIcon}
              title="No stock data wired up yet"
              description="Inventory isn't backed by a real stock model yet — alerts will appear here once it is."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { PharmacistDashboard }
