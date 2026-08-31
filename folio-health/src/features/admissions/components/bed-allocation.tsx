"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BedDoubleIcon, CheckCircle2Icon, LockIcon, SparklesIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAdmissions, useWardsAndBeds } from "../hooks/use-admissions"
import type { BedStatus } from "@/lib/mock/admissions"

const ALL = "all"

const TILE_CLASSES: Record<BedStatus, string> = {
  Available: "border-emerald-500/30 bg-emerald-500/5",
  Occupied: "border-blue-500/30 bg-blue-500/5",
  Reserved: "border-violet-500/30 bg-violet-500/5",
  Cleaning: "border-amber-500/30 bg-amber-500/5",
}

function BedAllocation() {
  const [wardFilter, setWardFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)

  const { data, isLoading } = useWardsAndBeds()
  // Current inpatients only: who is in each bed right now.
  const { data: admissions = [] } = useAdmissions(false)

  const allWards = useMemo(() => data?.wards ?? [], [data])
  const allBeds = useMemo(() => data?.beds ?? [], [data])

  const wards = useMemo(
    () => (wardFilter === ALL ? allWards : allWards.filter((w) => w.id === wardFilter)),
    [wardFilter, allWards]
  )

  /** Who occupies each bed, from the live admissions rather than a lookup table. */
  const occupantByBed = useMemo(() => {
    const map = new Map<string, string>()
    for (const admission of admissions) {
      if (admission.bedId) map.set(admission.bedId, admission.patientName ?? "Patient")
    }
    return map
  }, [admissions])

  const counts = useMemo(
    () => ({
      available: allBeds.filter((b) => b.status === "Available").length,
      occupied: allBeds.filter((b) => b.status === "Occupied").length,
      reserved: allBeds.filter((b) => b.status === "Reserved").length,
      cleaning: allBeds.filter((b) => b.status === "Cleaning").length,
    }),
    [allBeds]
  )

  return (
    <div>
      <PageHeader
        title="Bed Allocation"
        description={
          isLoading ? "Loading..." : `${allBeds.length} beds across ${allWards.length} wards`
        }
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Bed Allocation" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Beds" value={counts.available} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Occupied Beds" value={counts.occupied} icon={BedDoubleIcon} />
        <StatCard label="Reserved Beds" value={counts.reserved} icon={LockIcon} tone="violet" />
        <StatCard label="Beds Being Cleaned" value={counts.cleaning} icon={SparklesIcon} tone="amber" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Select value={wardFilter} onValueChange={(v) => setWardFilter(v ?? ALL)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Ward" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Wards</SelectItem>
            {allWards.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Reserved">Reserved</SelectItem>
            <SelectItem value="Cleaning">Cleaning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4">
        {wards.map((wardItem) => {
          const beds = allBeds.filter(
            (b) => b.wardId === wardItem.id && (statusFilter === ALL || b.status === statusFilter)
          )
          if (beds.length === 0) return null
          return (
            <Card key={wardItem.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{wardItem.name}</CardTitle>
                    <CardDescription>{wardItem.department}</CardDescription>
                  </div>
                  <Link
                    href="/admissions/wards"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Manage ward
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                  {beds.map((bed) => {
                    const occupant = occupantByBed.get(bed.id)
                    return (
                      <div
                        key={bed.id}
                        className={cn(
                          "flex flex-col gap-2 rounded-lg border px-3 py-2.5",
                          TILE_CLASSES[bed.status]
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{bed.label}</span>
                          <StatusBadge status={bed.status} />
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {occupant ?? "—"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export { BedAllocation }
