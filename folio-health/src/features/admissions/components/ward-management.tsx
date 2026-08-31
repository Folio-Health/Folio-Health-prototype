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
import { useWardsAndBeds } from "../hooks/use-admissions"
import type { Ward } from "@/lib/mock/admissions"

interface WardRow extends Ward {
  occupied: number
  available: number
  reserved: number
  cleaning: number
}

function WardManagement() {
  const { data, isLoading, isError } = useWardsAndBeds()
  const wards = useMemo(() => data?.wards ?? [], [data])
  const allBeds = useMemo(() => data?.beds ?? [], [data])

  const rows: WardRow[] = useMemo(
    () =>
      wards.map((w) => {
        const beds = allBeds.filter((b) => b.wardId === w.id)
        return {
          ...w,
          occupied: beds.filter((b) => b.status === "Occupied").length,
          available: beds.filter((b) => b.status === "Available").length,
          reserved: beds.filter((b) => b.status === "Reserved").length,
          cleaning: beds.filter((b) => b.status === "Cleaning").length,
        }
      }),
    [wards, allBeds]
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
        // FHIR Location has no "nurse in charge" field. The ward's managing
        // organization is the closest real relationship, and it is an
        // organization rather than a person — so this is honestly Unassigned
        // until Folio models ward leadership (a PractitionerRole would do it).
        const headNurseId = row.original.headNurseId
        return (
          <span className="text-muted-foreground">
            {headNurseId ? `Organization/${headNurseId}` : "Unassigned"}
          </span>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Ward Management"
        description={
          isLoading ? "Loading..." : `${wards.length} wards, ${allBeds.length} beds total`
        }
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Ward Management" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Wards" value={wards.length} icon={BuildingIcon} />
        <StatCard label="Total Bed Capacity" value={allBeds.length} icon={BuildingIcon} tone="violet" />
        <StatCard
          label="Overall Occupancy"
          // Guarded: a project with no beds yet would divide by zero and render NaN%.
          value={
            allBeds.length
              ? `${Math.round((rows.reduce((s, w) => s + w.occupied, 0) / allBeds.length) * 100)}%`
              : "—"
          }
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
