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
import { getPatientById } from "@/lib/mock/patients"
import {
  WARDS_LIST,
  getBedsByWard,
  getAdmissionByBedId,
  availableBedsCount,
  occupiedBedsCount,
  reservedBedsCount,
  cleaningBedsCount,
  BEDS_LIST,
} from "@/lib/mock/admissions"
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

  const wards = useMemo(
    () => (wardFilter === ALL ? WARDS_LIST : WARDS_LIST.filter((w) => w.id === wardFilter)),
    [wardFilter]
  )

  return (
    <div>
      <PageHeader
        title="Bed Allocation"
        description={`${BEDS_LIST.length} beds across ${WARDS_LIST.length} wards`}
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Bed Allocation" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Beds" value={availableBedsCount()} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Occupied Beds" value={occupiedBedsCount()} icon={BedDoubleIcon} />
        <StatCard label="Reserved Beds" value={reservedBedsCount()} icon={LockIcon} tone="violet" />
        <StatCard label="Beds Being Cleaned" value={cleaningBedsCount()} icon={SparklesIcon} tone="amber" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Select value={wardFilter} onValueChange={(v) => setWardFilter(v ?? ALL)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Ward" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Wards</SelectItem>
            {WARDS_LIST.map((w) => (
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
          const beds = getBedsByWard(wardItem.id).filter(
            (b) => statusFilter === ALL || b.status === statusFilter
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
                    const admission = getAdmissionByBedId(bed.id)
                    const patient = admission ? getPatientById(admission.patientId) : undefined
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
                          {patient ? patient.name : "N/A"}
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
