"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { BuildingIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import {
  WARDS_LIST,
  BEDS_LIST,
  getBedsByWard,
  getHeadNurse,
} from "@/lib/mock/admissions"
import type { Ward } from "@/lib/mock/admissions"

interface WardRow extends Ward {
  occupied: number
  available: number
  reserved: number
  cleaning: number
}

function WardManagement() {
  const rows: WardRow[] = useMemo(
    () =>
      WARDS_LIST.map((w) => {
        const beds = getBedsByWard(w.id)
        return {
          ...w,
          occupied: beds.filter((b) => b.status === "Occupied").length,
          available: beds.filter((b) => b.status === "Available").length,
          reserved: beds.filter((b) => b.status === "Reserved").length,
          cleaning: beds.filter((b) => b.status === "Cleaning").length,
        }
      }),
    []
  )

  const columns: ColumnDef<WardRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ward" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.department}</span>
        </div>
      ),
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Beds" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.capacity}</span>,
    },
    {
      accessorKey: "occupied",
      header: "Occupied",
      cell: ({ row }) => <span className="tabular-nums text-foreground">{row.original.occupied}</span>,
    },
    {
      accessorKey: "available",
      header: "Available",
      cell: ({ row }) => <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{row.original.available}</span>,
    },
    {
      id: "occupancy",
      header: "Occupancy",
      cell: ({ row }) => {
        const pct = Math.round((row.original.occupied / row.original.capacity) * 100)
        return (
          <div className="flex w-32 items-center gap-2">
            <Progress value={pct} className="flex-1 gap-0">
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
            <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </div>
        )
      },
    },
    {
      id: "nurse",
      header: "Nurse in Charge",
      cell: ({ row }) => {
        const nurse = getHeadNurse(row.original)
        if (!nurse) return <span className="text-muted-foreground">Unassigned</span>
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={nurse.name} seed={nurse.avatarSeed} size="sm" />
            <span className="text-foreground">{nurse.name}</span>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Ward Management"
        description={`${WARDS_LIST.length} wards, ${BEDS_LIST.length} beds total`}
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Ward Management" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Wards" value={WARDS_LIST.length} icon={BuildingIcon} />
        <StatCard label="Total Bed Capacity" value={BEDS_LIST.length} icon={BuildingIcon} tone="violet" />
        <StatCard
          label="Overall Occupancy"
          value={`${Math.round((rows.reduce((s, w) => s + w.occupied, 0) / BEDS_LIST.length) * 100)}%`}
          icon={BuildingIcon}
          tone="amber"
        />
        <StatCard
          label="Beds Available"
          value={rows.reduce((s, w) => s + w.available, 0)}
          icon={BuildingIcon}
          tone="emerald"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No wards configured"
        emptyDescription="Wards will appear here once configured."
        pageSize={10}
      />
    </div>
  )
}

export { WardManagement }
