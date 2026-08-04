"use client"

import { useMemo, useState } from "react"
import { SearchIcon, WrenchIcon, CheckCircle2Icon, TriangleAlertIcon, PowerOffIcon } from "lucide-react"
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
import { InventoryModuleTabs } from "./inventory-module-tabs"
import { equipmentColumns } from "./equipment-columns"
import { EQUIPMENT } from "@/lib/mock/inventory"

const ALL = "all"

function EquipmentList() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  const operational = EQUIPMENT.filter((e) => e.status === "Operational").length
  const underMaintenance = EQUIPMENT.filter((e) => e.status === "Under Maintenance").length
  const outOfService = EQUIPMENT.filter((e) => e.status === "Out of Service").length

  const filtered = useMemo(() => {
    return EQUIPMENT.filter((e) => {
      if (status !== ALL && e.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!e.name.toLowerCase().includes(q) && !e.serialNumber.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [search, status])

  return (
    <div>
      <PageHeader
        title="Equipment Tracking"
        description="Medical equipment status, location, and service history"
        breadcrumbs={[{ label: "Facility" }, { label: "Inventory", href: "/inventory" }, { label: "Equipment" }]}
      />

      <InventoryModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Equipment" value={EQUIPMENT.length} icon={WrenchIcon} />
        <StatCard label="Operational" value={operational} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Under Maintenance" value={underMaintenance} icon={TriangleAlertIcon} tone="amber" />
        <StatCard label="Out of Service" value={outOfService} icon={PowerOffIcon} tone="red" />
      </div>

      <DataTable
        columns={equipmentColumns}
        data={filtered}
        emptyTitle="No equipment found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name or serial number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                <SelectItem value="Out of Service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { EquipmentList }
