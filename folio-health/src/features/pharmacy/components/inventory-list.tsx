"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { SearchIcon, BoxesIcon, TriangleAlertIcon, PackageXIcon, CalendarClockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PharmacyModuleTabs } from "./pharmacy-module-tabs"
import { getInventoryColumns } from "./inventory-columns"
import { DRUGS, getInventoryStatus, getSupplierById, formatNaira, type Drug } from "@/lib/mock/pharmacy"

const ALL = "all"
const TABS = [
  { value: ALL, label: "All" },
  { value: "Low Stock", label: "Low Stock" },
  { value: "Expiring Soon", label: "Expiring Soon" },
]

function InventoryList() {
  const [tab, setTab] = useState(ALL)
  const [search, setSearch] = useState("")
  const [viewing, setViewing] = useState<Drug | null>(null)

  const totalSkus = DRUGS.length
  const lowStockCount = DRUGS.filter((d) => getInventoryStatus(d) === "Low Stock").length
  const outOfStockCount = DRUGS.filter((d) => getInventoryStatus(d) === "Out of Stock").length
  const expiringCount = DRUGS.filter((d) => {
    const s = getInventoryStatus(d)
    return s === "Expiring" || s === "Expired"
  }).length

  const filtered = useMemo(() => {
    return DRUGS.filter((d) => {
      const status = getInventoryStatus(d)
      if (tab === "Low Stock" && status !== "Low Stock") return false
      if (tab === "Expiring Soon" && status !== "Expiring" && status !== "Expired") return false
      if (search) {
        const q = search.toLowerCase()
        if (!d.name.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q) && !d.batchNo.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [tab, search])

  function handleReorder(drug: Drug) {
    toast.success(`Reorder request created for ${drug.name}`, {
      description: `Batch ${drug.batchNo} flagged for the next purchase order.`,
    })
  }

  const columns = getInventoryColumns({ onView: setViewing, onReorder: handleReorder })
  const viewingSupplier = viewing ? getSupplierById(viewing.supplierId) : undefined

  return (
    <div>
      <PageHeader
        title="Drug Inventory"
        description="Stock levels, batches, and expiry tracking across the pharmacy"
        breadcrumbs={[
          { label: "Pharmacy & Finance" },
          { label: "Pharmacy", href: "/pharmacy" },
          { label: "Inventory" },
        ]}
      />

      <PharmacyModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={totalSkus} icon={BoxesIcon} />
        <StatCard label="Low Stock" value={lowStockCount} icon={TriangleAlertIcon} tone="amber" />
        <StatCard label="Out of Stock" value={outOfStockCount} icon={PackageXIcon} tone="red" />
        <StatCard label="Expiring Soon" value={expiringCount} icon={CalendarClockIcon} tone="violet" />
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(drug) => setViewing(drug)}
          emptyTitle="No drugs found"
          emptyDescription="Try adjusting your search or filters."
          toolbar={
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by drug, category, or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          }
        />
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>
                  {viewing.category} &middot; Batch {viewing.batchNo}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Stock Qty" value={`${viewing.stockQty.toLocaleString()} ${viewing.unit}`} />
                <Field label="Reorder Level" value={`${viewing.reorderLevel.toLocaleString()} ${viewing.unit}`} />
                <Field label="Unit Price" value={formatNaira(viewing.price)} />
                <Field label="Expiry Date" value={format(new Date(viewing.expiryDate), "dd MMM yyyy")} />
                <Field label="Supplier" value={viewingSupplier?.name ?? "Unknown"} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={getInventoryStatus(viewing)} className="w-fit" />
                </div>
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

export { InventoryList }
