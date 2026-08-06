"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorState } from "@/components/common/empty-state"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { downloadCsv } from "@/lib/csv-export"
import { facilitiesColumns } from "./facilities-columns"
import { useFacilities } from "../hooks/use-facilities"

const ALL = "all"

function FacilitiesList() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  const debouncedSearch = useDebouncedValue(search, 300)
  const { data, isLoading, isError, error, refetch } = useFacilities({
    search: debouncedSearch,
    status,
  })

  const facilities = data?.facilities ?? []

  function handleExport() {
    downloadCsv(
      `facilities-${new Date().toISOString().slice(0, 10)}.csv`,
      facilities.map((f) => ({
        Name: f.name,
        Identifier: f.identifier,
        Type: f.type,
        Address: f.address,
        Phone: f.phone,
        Email: f.email,
        Status: f.active ? "Active" : "Inactive",
      }))
    )
    toast.success(`Exported ${facilities.length} facilities to CSV`)
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Facilities" breadcrumbs={[{ label: "System" }, { label: "Facilities" }]} />
        <ErrorState
          title="Could not load facilities"
          description={error instanceof Error ? error.message : "Could not reach Folio. Check your connection and try again."}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  const total = data?.total ?? facilities.length

  return (
    <div>
      <PageHeader
        title="Facilities"
        description={
          isLoading
            ? "Loading facilities…"
            : `${total} facilit${total === 1 ? "y" : "ies"} registered`
        }
        breadcrumbs={[{ label: "System" }, { label: "Facilities" }]}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={isLoading || !facilities.length}>
            <DownloadIcon />
            Export
          </Button>
        }
      />

      <DataTable
        columns={facilitiesColumns}
        data={facilities}
        isLoading={isLoading}
        onRowClick={(facility) => router.push(`/facilities/${facility.id}`)}
        emptyTitle="No facilities found"
        emptyDescription="No facilities match your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { FacilitiesList }
