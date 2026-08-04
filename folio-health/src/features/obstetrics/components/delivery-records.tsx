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
import { deliveryColumns } from "./delivery-columns"
import { DELIVERY_RECORDS } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"

function DeliveryRecords() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState(ALL)

  const filtered = useMemo(() => {
    return DELIVERY_RECORDS.filter((d) => {
      if (type !== ALL && d.type !== type) return false
      if (search && !getPatientById(d.patientId)?.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, type])

  return (
    <div>
      <PageHeader
        title="Delivery Records"
        description="Birth outcomes and delivery details"
        breadcrumbs={[{ label: "Clinical" }, { label: "Obstetrics", href: "/obstetrics" }, { label: "Delivery Records" }]}
      />

      <ObstetricsModuleTabs />

      <DataTable
        columns={deliveryColumns}
        data={filtered}
        emptyTitle="No delivery records found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={type} onValueChange={(v) => setType(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Types</SelectItem>
                <SelectItem value="Vaginal">Vaginal</SelectItem>
                <SelectItem value="C-Section">C-Section</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { DeliveryRecords }
