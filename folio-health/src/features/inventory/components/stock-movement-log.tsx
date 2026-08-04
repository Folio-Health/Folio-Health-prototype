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
import { InventoryModuleTabs } from "./inventory-module-tabs"
import { stockMovementColumns } from "./stock-movement-columns"
import { STOCK_MOVEMENTS } from "@/lib/mock/inventory"

const ALL = "all"

function StockMovementLog() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState(ALL)

  const filtered = useMemo(() => {
    return STOCK_MOVEMENTS.filter((m) => {
      if (type !== ALL && m.movementType !== type) return false
      if (search && !m.itemName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, type])

  return (
    <div>
      <PageHeader
        title="Stock Movement Log"
        description="Audit trail of incoming, outgoing, and transferred inventory"
        breadcrumbs={[{ label: "Facility" }, { label: "Inventory", href: "/inventory" }, { label: "Stock Movement" }]}
      />

      <InventoryModuleTabs />

      <DataTable
        columns={stockMovementColumns}
        data={filtered}
        emptyTitle="No stock movements found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by item name..."
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
                <SelectItem value="In">In</SelectItem>
                <SelectItem value="Out">Out</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { StockMovementLog }
