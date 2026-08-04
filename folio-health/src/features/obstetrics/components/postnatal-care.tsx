"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ObstetricsModuleTabs } from "./obstetrics-module-tabs"
import { postnatalColumns } from "./postnatal-columns"
import { POSTNATAL_RECORDS } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"

function PostnatalCare() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  const filtered = useMemo(() => {
    return POSTNATAL_RECORDS.filter((p) => {
      if (status !== ALL && p.status !== status) return false
      if (search && !getPatientById(p.motherPatientId)?.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, status])

  return (
    <div>
      <PageHeader
        title="Postnatal Care"
        description="Follow-up visits for mothers and newborns after delivery"
        breadcrumbs={[{ label: "Clinical" }, { label: "Obstetrics", href: "/obstetrics" }, { label: "Postnatal Care" }]}
      />

      <ObstetricsModuleTabs />

      <DataTable
        columns={postnatalColumns}
        data={filtered}
        emptyTitle="No postnatal records found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by mother's name..."
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
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { PostnatalCare }
