"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, FileTextIcon, ClockIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react"
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
import { getPurchaseRequestsColumns } from "./purchase-requests-columns"
import { PURCHASE_REQUESTS, type PurchaseRequest } from "@/lib/mock/inventory"

const ALL = "all"

function PurchaseRequestsList() {
  const [requests, setRequests] = useState<PurchaseRequest[]>(PURCHASE_REQUESTS)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  function handleApprove(request: PurchaseRequest) {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "Approved" } : r)))
    toast.success(`Request ${request.id} approved`)
  }

  function handleReject(request: PurchaseRequest) {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "Rejected" } : r)))
    toast.error(`Request ${request.id} rejected`)
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (status !== ALL && r.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.id.toLowerCase().includes(q) && !r.items.some((i) => i.itemName.toLowerCase().includes(q))) {
          return false
        }
      }
      return true
    })
  }, [requests, search, status])

  const pending = requests.filter((r) => r.status === "Pending").length
  const approved = requests.filter((r) => r.status === "Approved").length
  const rejected = requests.filter((r) => r.status === "Rejected").length

  const columns = getPurchaseRequestsColumns({ onApprove: handleApprove, onReject: handleReject })

  return (
    <div>
      <PageHeader
        title="Purchase Requests"
        description="Departmental requests for restocking medical supplies"
        breadcrumbs={[{ label: "Facility" }, { label: "Inventory", href: "/inventory" }, { label: "Purchase Requests" }]}
      />

      <InventoryModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Requests" value={requests.length} icon={FileTextIcon} />
        <StatCard label="Pending" value={pending} icon={ClockIcon} tone="amber" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Rejected" value={rejected} icon={XCircleIcon} tone="red" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No purchase requests found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by request ID or item..."
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { PurchaseRequestsList }
