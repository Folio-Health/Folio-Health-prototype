"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, PillIcon, ClockIcon, CheckCircle2Icon, TriangleAlertIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NursingModuleTabs } from "./nursing-module-tabs"
import { getMarColumns } from "./mar-columns"
import { MEDICATION_ORDERS, type MedicationOrder } from "@/lib/mock/nursing"
import { NURSES } from "@/lib/mock/staff"

const ALL = "all"

function MarList() {
  const [orders, setOrders] = useState<MedicationOrder[]>(MEDICATION_ORDERS)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== ALL && o.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!o.drug.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [orders, search, status])

  function handleMarkGiven(order: MedicationOrder) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, status: "Given", administeredByStaffId: NURSES[0]?.id ?? "" } : o
      )
    )
    toast.success(`${order.drug} marked as given`, {
      description: "The medication administration record has been updated.",
    })
  }

  const given = orders.filter((o) => o.status === "Given").length
  const pending = orders.filter((o) => o.status === "Pending").length
  const missed = orders.filter((o) => o.status === "Missed").length

  const columns = getMarColumns({ onMarkGiven: handleMarkGiven })

  return (
    <div>
      <PageHeader
        title="Medication Administration Record"
        description="Scheduled medications for your assigned patients today"
        breadcrumbs={[{ label: "Clinical" }, { label: "Nursing", href: "/nursing" }, { label: "MAR" }]}
      />

      <NursingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Scheduled" value={orders.length} icon={PillIcon} />
        <StatCard label="Given" value={given} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Pending" value={pending} icon={ClockIcon} tone="amber" />
        <StatCard label="Missed" value={missed} icon={TriangleAlertIcon} tone="red" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No medications found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by drug name..."
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
                <SelectItem value="Given">Given</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { MarList }
