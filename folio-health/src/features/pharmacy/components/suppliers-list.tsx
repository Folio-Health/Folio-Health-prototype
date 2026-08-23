"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { phoneInputProps, sanitizePhoneInput } from "@/lib/phone"
import { PlusIcon, SearchIcon, TruckIcon, MailIcon, PhoneIcon, UserIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { getSupplierColumns } from "./supplier-columns"
import { SUPPLIERS } from "@/lib/mock/pharmacy"
import type { Supplier } from "@/lib/mock/pharmacy"

const EMPTY_FORM = { name: "", contact: "", phone: "", email: "" }

function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS)
  const [search, setSearch] = useState("")
  const [viewing, setViewing] = useState<Supplier | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const activeCount = suppliers.filter((s) => s.status === "Active").length
  const totalProducts = suppliers.reduce((sum, s) => sum + s.itemsSupplied, 0)

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const q = search.trim().toLowerCase()
    return suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    )
  }, [suppliers, search])

  function handleToggleStatus(supplier: Supplier) {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplier.id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s))
    )
    toast.success(`${supplier.name} ${supplier.status === "Active" ? "deactivated" : "activated"}`)
  }

  function handleAddSupplier() {
    if (!form.name.trim() || !form.contact.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    const newSupplier: Supplier = {
      id: `SUP-${String(suppliers.length + 1).padStart(4, "0")}`,
      name: form.name,
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      itemsSupplied: 0,
      status: "Active",
    }
    setSuppliers((prev) => [newSupplier, ...prev])
    toast.success(`${newSupplier.name} added as a supplier`)
    setForm(EMPTY_FORM)
    setAdding(false)
  }

  const columns = getSupplierColumns({ onView: setViewing, onToggleStatus: handleToggleStatus })

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Vendors supplying drugs and medical consumables"
        breadcrumbs={[
          { label: "Pharmacy & Finance" },
          { label: "Pharmacy", href: "/pharmacy" },
          { label: "Suppliers" },
        ]}
        actions={
          <RoleGate roles={["pharmacist", "facility-admin"]}>
            <Button onClick={() => setAdding(true)}>
              <PlusIcon />
              Add Supplier
            </Button>
          </RoleGate>
        }
      />

      <PharmacyModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Suppliers" value={suppliers.length} icon={TruckIcon} />
        <StatCard label="Active Suppliers" value={activeCount} icon={TruckIcon} tone="emerald" />
        <StatCard label="Products Supplied" value={totalProducts} icon={TruckIcon} tone="violet" />
        <StatCard label="Inactive Suppliers" value={suppliers.length - activeCount} icon={TruckIcon} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(supplier) => setViewing(supplier)}
        emptyTitle="No suppliers found"
        emptyDescription="Try adjusting your search, or add a new supplier."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name, contact, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-sm">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>Supplier details</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span>{viewing.contact}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneIcon className="size-4 text-muted-foreground" />
                  <span>{viewing.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span>{viewing.email}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-muted-foreground">Products Supplied</span>
                  <span className="font-medium text-foreground">{viewing.itemsSupplied}</span>
                </div>
                <StatusBadge status={viewing.status} className="w-fit" />
              </div>
              <DialogFooter showCloseButton />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Register a new drug or supplies vendor.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-name">Supplier Name</Label>
              <Input
                id="supplier-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. MedPlus Distributors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-contact">Contact Person</Label>
              <Input
                id="supplier-contact"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhoneInput(e.target.value) }))}
                {...phoneInputProps}
                placeholder="+234..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@company.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <RoleGate roles={["pharmacist", "facility-admin"]}>
              <Button onClick={handleAddSupplier}>Add Supplier</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { SuppliersList }
