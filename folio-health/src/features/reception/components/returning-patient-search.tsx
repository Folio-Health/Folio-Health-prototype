"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { SearchIcon, PlayIcon, EyeIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { searchPatients } from "@/lib/mock/patients"
import type { Patient } from "@/types/core"

function ReturningPatientSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchPatients(query).slice(0, 25)
  }, [query])

  function startVisit(patient: Patient) {
    toast.success(`Visit started for ${patient.name}`, {
      description: `${patient.mrn} added to the front-desk queue.`,
    })
    router.push("/reception/queue")
  }

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground">{patient.mrn}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <span>{row.original.gender}, {row.original.age}y</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/patients/${row.original.id}`)
            }}
          >
            <EyeIcon />
            Profile
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              startVisit(row.original)
            }}
          >
            <PlayIcon />
            Start Visit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Returning Patient"
        description="Find an existing patient by MRN, phone, or name to start a new visit"
        breadcrumbs={[{ label: "Front Desk" }, { label: "Reception", href: "/reception" }, { label: "Returning Patient" }]}
      />

      <div className="flex flex-col gap-4">
        <InputGroup className="h-9 max-w-md">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by MRN, phone, or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </InputGroup>

        {query.trim() ? (
          <DataTable
            columns={columns}
            data={results}
            emptyTitle="No matching patients"
            emptyDescription="Try a different name, MRN, or phone number, or register them as a new patient."
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            Start typing a patient&apos;s name, MRN, or phone number to search.
          </p>
        )}
      </div>
    </div>
  )
}

export { ReturningPatientSearch }
