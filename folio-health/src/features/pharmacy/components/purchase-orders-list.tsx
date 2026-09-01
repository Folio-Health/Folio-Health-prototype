"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { PlusIcon, SearchIcon, ClipboardListIcon, ClockIcon, CheckCircle2Icon, TruckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { RoleGate } from "@/components/common/role-gate"
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
  formatNaira,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "@/lib/mock/pharmacy"
import {
  useAdvancePurchaseOrder,
  useCreatePurchaseOrder,
  usePurchaseOrders,
  useSuppliers,
} from "../hooks/use-inventory"

const NEXT_STATUS: Record<PurchaseOrderStatus, PurchaseOrderStatus | null> = {
  Draft: "Pending",
  Pending: "Approved",
  Approved: "Delivered",
  Delivered: null,
}

function PurchaseOrdersList() {
  const [search, setSearch] = useState("")
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null)
  const [creating, setCreating] = useState(false)
  const [supplierId, setSupplierId] = useState<string>("")

  const { data: orders = [], isLoading, isError } = usePurchaseOrders()
  const { data: suppliers = [] } = useSuppliers()
  const createOrder = useCreatePurchaseOrder()
  const advanceOrder = useAdvancePurchaseOrder()

  const supplierById = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers]
  )

  const pendingCount = orders.filter((o) => o.status === "Pending").length
  const approvedCount = orders.filter((o) => o.status === "Approved").length
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const supplier = supplierById.get(o.supplierId)
      return o.id.toLowerCase().includes(q) || Boolean(supplier?.name.toLowerCase().includes(q))
    })
  }, [orders, search, supplierById])

  async function handleAdvance(po: PurchaseOrder) {
    const next = NEXT_STATUS[po.status]
    if (!next) return
    try {
      await advanceOrder.mutateAsync({ orderId: po.id, status: next })
      toast.success(`Order moved to ${next}`, {
        // Receiving an order is what puts the drugs on the shelf, so say so.
        description: next === "Delivered" ? "Stock levels have been increased." : undefined,
      })
      setViewing((v) => (v && v.id === po.id ? { ...v, status: next } : v))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order")
    }
  }

  async function handleCreate() {
    const supplier = supplierById.get(supplierId)
    if (!supplier) {
      toast.error("Select a supplier")
      return
    }
    try {
      // A draft starts with no line items; they are added when the buyer knows
      // what is being ordered, and the total is computed from them server-side.
      await createOrder.mutateAsync({
        supplier: { reference: `Organization/${supplier.id}`, display: supplier.name },
        items: [],
        status: "Draft",
      })
      toast.success("Draft order created", { description: `For ${supplier.name}.` })
      setCreating(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the order")
    }
  }

  const columns = getPurchaseOrderColumns({ onView: setViewing, onAdvance: handleAdvance })
  const viewingSupplier = viewing ? supplierById.get(viewing.supplierId) : undefined

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
          <RoleGate roles={["pharmacist", "facility-admin"]}>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon />
              New Purchase Order
            </Button>
          </RoleGate>
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
        isLoading={isLoading}
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
                  <RoleGate roles={["pharmacist", "facility-admin"]}>
                    <Button onClick={() => handleAdvance(viewing)}>
                      Mark as {NEXT_STATUS[viewing.status]}
                    </Button>
                  </RoleGate>
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
                {suppliers.map((s) => (
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
            <RoleGate roles={["pharmacist", "facility-admin"]}>
              <Button onClick={handleCreate}>Create Order</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PurchaseOrdersList }
