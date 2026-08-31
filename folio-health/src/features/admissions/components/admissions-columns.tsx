"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontalIcon, EyeIcon, DoorOpenIcon, ArrowRightLeftIcon } from "lucide-react"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { RoleGate } from "@/components/common/role-gate"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Admission } from "@/lib/mock/admissions"

/**
 * @param names ward and bed labels, keyed by id. The caller already holds them
 *   from the wards/beds query, so passing them in avoids a lookup per row
 *   against data this component would otherwise have to fetch itself.
 */
function admissionsColumns(
  onDischarge: (admission: Admission) => void,
  names: { wards?: Map<string, string>; beds?: Map<string, string> } = {}
): ColumnDef<Admission>[] {
  return [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const { patientId, patientName } = row.original as Admission & { patientName?: string }
        const label = patientName ?? "View patient"
        return (
          <Link
            href={`/patients/${patientId}`}
            className="flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <PersonAvatar name={label} seed={patientId} size="sm" />
            <span className="font-medium text-foreground hover:text-primary hover:underline">
              {label}
            </span>
          </Link>
        )
      },
    },
    {
      id: "ward",
      header: "Ward / Bed",
      cell: ({ row }) => {
        const ward = names.wards?.get(row.original.wardId)
        const bed = names.beds?.get(row.original.bedId)
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{ward ?? "Unassigned"}</span>
            <span className="text-xs text-muted-foreground">{bed ?? "No bed"}</span>
          </div>
        )
      },
    },
    {
      id: "doctor",
      header: "Admitting Doctor",
      cell: ({ row }) => {
        const { doctorId } = row.original
        // Practitioner names are not included on this query; the reference is
        // shown rather than a fabricated name.
        return (
          <span className="text-muted-foreground">
            {doctorId ? `Practitioner/${doctorId}` : "Unassigned"}
          </span>
        )
      },
    },
    {
      accessorKey: "admissionDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Admission Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.admissionDate), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const admission = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Open actions menu" />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/patients/${admission.patientId}`} />}>
                <EyeIcon />
                View Patient
              </DropdownMenuItem>
              <RoleGate roles={["doctor", "nurse"]}>
                <DropdownMenuItem
                  disabled={admission.status !== "Admitted"}
                  onClick={() => onDischarge(admission)}
                >
                  <DoorOpenIcon />
                  Discharge
                </DropdownMenuItem>
              </RoleGate>
              <DropdownMenuItem render={<Link href="/admissions/transfers" />}>
                <ArrowRightLeftIcon />
                Transfer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export { admissionsColumns }
