"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { PlusIcon, SearchIcon, ClipboardListIcon, ClockIcon, CheckCircle2Icon, TruckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PharmacyModuleTabs } from "./pharmacy-module-tabs"
import { getPurchaseOrderColumns } from "./purchase-order-columns"
import {
  PURCHASE_ORDERS,
  SUPPLIERS,
  DRUGS,
  getSupplierById,
  formatNaira,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "@/lib/mock/pharmacy"
import { faker } from "@faker-js/faker"

const NEXT_STATUS: Record<PurchaseOrderStatus, PurchaseOrderStatus | null> = {
  Draft: "Pending",
  Pending: "Approved",
  Approved: "Delivered",
  Delivered: null,
}

function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(PURCHASE_ORDERS)
  const [search, setSearch] = useState("")
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null)
  const [creating, setCreating] = useState(false)
  const [supplierId, setSupplierId] = useState<string>(SUPPLIERS[0]?.id ?? "")

  const pendingCount = orders.filter((o) => o.status === "Pending").length
  const approvedCount = orders.filter((o) => o.status === "Approved").length
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const supplier = getSupplierById(o.supplierId)
      return o.id.toLowerCase().includes(q) || supplier?.name.toLowerCase().includes(q)
    })
  }, [orders, search])

  function handleAdvance(po: PurchaseOrder) {
    const next = NEXT_STATUS[po.status]
    if (!next) return
    setOrders((prev) => prev.map((o) => (o.id === po.id ? { ...o, status: next } : o)))
    toast.success(`${po.id} moved to ${next}`)
    setViewing((v) => (v && v.id === po.id ? { ...v, status: next } : v))
  }

  function handleCreate() {
    const supplier = getSupplierById(supplierId)
    if (!supplier) {
      toast.error("Select a supplier")
      return
    }
    const items = faker.helpers.arrayElements(DRUGS, faker.number.int({ min: 2, max: 5 })).map((drug) => ({
      drugId: drug.id,
      drugName: drug.name,
      quantity: faker.number.int({ min: 20, max: 150 }),
      unitPrice: drug.price,
    }))
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const newPo: PurchaseOrder = {
      id: `PO-${String(orders.length + 1).padStart(4, "0")}`,
      supplierId,
      items,
      totalAmount,
      status: "Draft",
      date: new Date().toISOString(),
    }
    setOrders((prev) => [newPo, ...prev])
    toast.success(`${newPo.id} created`, { description: `Draft order for ${supplier.name}.` })
    setCreating(false)
  }

  const columns = getPurchaseOrderColumns({ onView: setViewing, onAdvance: handleAdvance })
  const viewingSupplier = viewing ? getSupplierById(viewing.supplierId) : undefined

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Restocking orders placed with pharmacy suppliers"
        breadcrumbs={[
          { label: "Pharmacy & Finance" },
          { label: "Pharmacy", href: "/pharmacy" },
          { label: "Purchase Orders" },
        ]}
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon />
            New Purchase Order
          </Button>
        }
      />

      <PharmacyModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Approval" value={pendingCount} icon={ClockIcon} tone="amber" />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2Icon} tone="violet" />
        <StatCard label="Delivered" value={deliveredCount} icon={TruckIcon} tone="emerald" />
        <StatCard label="Total Order Value" value={formatNaira(totalValue)} icon={ClipboardListIcon} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(po) => setViewing(po)}
        emptyTitle="No purchase orders found"
        emptyDescription="Try adjusting your search, or create a new purchase order."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by PO number or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.id}</DialogTitle>
                <DialogDescription>
                  {viewingSupplier?.name ?? "Unknown supplier"} &middot; {format(new Date(viewing.date), "dd MMM yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={viewing.status} />
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-9 px-3">Drug</TableHead>
                      <TableHead className="h-9 px-3 text-right">Qty</TableHead>
                      <TableHead className="h-9 px-3 text-right">Unit Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewing.items.map((item, i) => (
                      <TableRow key={`${item.drugId}-${i}`}>
                        <TableCell className="px-3 py-2 font-medium text-foreground">{item.drugName}</TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums">{formatNaira(item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-1 text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-foreground">{formatNaira(viewing.totalAmount)}</span>
              </div>
              <DialogFooter showCloseButton>
                {NEXT_STATUS[viewing.status] && (
                  <Button onClick={() => handleAdvance(viewing)}>
                    Mark as {NEXT_STATUS[viewing.status]}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>Create a draft order with restock items for a supplier.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="po-supplier">Supplier</Label>
            <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? supplierId)}>
              <SelectTrigger id="po-supplier" className="w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIERS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              A set of restock items will be generated automatically for this draft.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PurchaseOrdersList }
