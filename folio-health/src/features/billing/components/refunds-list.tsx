"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { SearchIcon, ClockIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { BillingModuleTabs } from "./billing-module-tabs"
import { getRefundColumns } from "./refund-columns"
import { REFUNDS, formatNaira, type Refund, type RefundStatus } from "@/lib/mock/billing"
import { getPatientById } from "@/lib/mock/patients"

function RefundsList() {
  const [statuses, setStatuses] = useState<Record<string, RefundStatus>>(() => {
    const initial: Record<string, RefundStatus> = {}
    for (const r of REFUNDS) initial[r.id] = r.status
    return initial
  })
  const [search, setSearch] = useState("")
  const [viewing, setViewing] = useState<Refund | null>(null)

  const rows = useMemo(() => REFUNDS.map((r) => ({ ...r, status: statuses[r.id] ?? r.status })), [statuses])

  const pendingCount = rows.filter((r) => r.status === "Pending").length
  const processedTotal = rows.filter((r) => r.status === "Processed").reduce((sum, r) => sum + r.amount, 0)
  const rejectedCount = rows.filter((r) => r.status === "Rejected").length

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const patient = getPatientById(r.patientId)
      return (
        r.id.toLowerCase().includes(q) ||
        r.invoiceId.toLowerCase().includes(q) ||
        patient?.name.toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  function updateStatus(refund: Refund, status: RefundStatus) {
    setStatuses((prev) => ({ ...prev, [refund.id]: status }))
    toast.success(`${refund.id} ${status === "Processed" ? "processed" : "rejected"}`)
  }

  const columns = getRefundColumns({
    onView: setViewing,
    onProcess: (r) => updateStatus(r, "Processed"),
    onReject: (r) => updateStatus(r, "Rejected"),
  })
  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Refund requests raised against paid invoices"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Billing", href: "/billing" }, { label: "Refunds" }]}
      />

      <BillingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Pending Refunds" value={pendingCount} icon={ClockIcon} tone="amber" />
        <StatCard label="Processed Total" value={formatNaira(processedTotal)} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircleIcon} tone="red" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(refund) => setViewing(refund)}
        emptyTitle="No refunds found"
        emptyDescription="Try adjusting your search."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by refund ID, invoice, or patient..."
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
                <DialogTitle>{viewing.id}</DialogTitle>
                <DialogDescription>
                  {viewing.invoiceId} &middot; {format(new Date(viewing.date), "dd MMM yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  {viewingPatient && (
                    <PersonAvatar name={viewingPatient.name} seed={viewingPatient.avatarSeed} size="sm" />
                  )}
                  <span className="font-medium text-foreground">{viewingPatient?.name ?? "Unknown"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">{formatNaira(viewing.amount)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Reason</span>
                  <span className="text-foreground">{viewing.reason}</span>
                </div>
                <StatusBadge status={statuses[viewing.id] ?? viewing.status} className="w-fit" />
              </div>
              <DialogFooter showCloseButton>
                {(statuses[viewing.id] ?? viewing.status) === "Pending" && (
                  <RoleGate permission="BILLING_REFUND">
                    <Button variant="outline" onClick={() => updateStatus(viewing, "Rejected")}>
                      <XCircleIcon />
                      Reject
                    </Button>
                    <Button onClick={() => updateStatus(viewing, "Processed")}>
                      <CheckCircle2Icon />
                      Process Refund
                    </Button>
                  </RoleGate>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { RefundsList }
