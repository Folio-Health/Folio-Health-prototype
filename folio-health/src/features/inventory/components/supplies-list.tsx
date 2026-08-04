"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { SearchIcon, BoxesIcon, TriangleAlertIcon, PackageXIcon, WalletIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { InventoryModuleTabs } from "./inventory-module-tabs"
import { getSuppliesColumns } from "./supplies-columns"
import { SUPPLY_ITEMS, SUPPLY_CATEGORIES, getSupplyStatus, formatNaira, type SupplyItem } from "@/lib/mock/inventory"

const ALL = "all"

function SuppliesList() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [viewing, setViewing] = useState<SupplyItem | null>(null)

  const totalValue = SUPPLY_ITEMS.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
  const lowStock = SUPPLY_ITEMS.filter((i) => getSupplyStatus(i) === "Low Stock").length
  const outOfStock = SUPPLY_ITEMS.filter((i) => getSupplyStatus(i) === "Out of Stock").length

  const filtered = useMemo(() => {
    return SUPPLY_ITEMS.filter((item) => {
      const itemStatus = getSupplyStatus(item)
      if (category !== ALL && item.category !== category) return false
      if (status !== ALL && itemStatus !== status) return false
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, category, status])

  function handleReorder(item: SupplyItem) {
    toast.success(`Reorder request created for ${item.name}`, {
      description: "The request has been sent to the purchasing team.",
    })
  }

  const columns = getSuppliesColumns({ onView: setViewing, onReorder: handleReorder })

  return (
    <div>
      <PageHeader
        title="Medical Supplies"
        description="Stock levels and reorder tracking across hospital supplies"
        breadcrumbs={[{ label: "Facility" }, { label: "Inventory" }]}
      />

      <InventoryModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Items" value={SUPPLY_ITEMS.length} icon={BoxesIcon} />
        <StatCard label="Low Stock" value={lowStock} icon={TriangleAlertIcon} tone="amber" />
        <StatCard label="Out of Stock" value={outOfStock} icon={PackageXIcon} tone="red" />
        <StatCard label="Total Value" value={formatNaira(totalValue)} icon={WalletIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(item) => setViewing(item)}
        emptyTitle="No supplies found"
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
            <Select value={category} onValueChange={(v) => setCategory(v ?? ALL)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Categories</SelectItem>
                {SUPPLY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>{viewing.category}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Quantity" value={`${viewing.quantity.toLocaleString()} ${viewing.unit}`} />
                <Field label="Reorder Level" value={`${viewing.reorderLevel.toLocaleString()} ${viewing.unit}`} />
                <Field label="Unit Cost" value={formatNaira(viewing.unitCost)} />
                <Field label="Total Value" value={formatNaira(viewing.quantity * viewing.unitCost)} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={getSupplyStatus(viewing)} className="w-fit" />
                </div>
                <Field label="As of" value={format(new Date(), "MMM d, yyyy")} />
              </div>
              <DialogFooter showCloseButton />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

export { SuppliesList }
