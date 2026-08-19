"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, TriangleAlertIcon, ClockIcon, WalletIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
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
import { BillingModuleTabs } from "./billing-module-tabs"
import { getOutstandingColumns } from "./outstanding-columns"
import { OUTSTANDING_BILLS, formatNaira, type OutstandingBill } from "@/lib/mock/billing"
import { getPatientById } from "@/lib/mock/patients"

function OutstandingList() {
  const [bills, setBills] = useState<OutstandingBill[]>(OUTSTANDING_BILLS)
  const [search, setSearch] = useState("")
  const [paying, setPaying] = useState<OutstandingBill | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  const overdueCount = bills.filter((b) => b.status === "Overdue").length
  const totalDue = bills.reduce((sum, b) => sum + b.amountDue, 0)
  const noReminderCount = bills.filter((b) => !b.lastReminderSent).length

  const filtered = useMemo(() => {
    if (!search.trim()) return bills
    const q = search.trim().toLowerCase()
    return bills.filter((b) => {
      const patient = getPatientById(b.patientId)
      return b.invoiceId.toLowerCase().includes(q) || patient?.name.toLowerCase().includes(q)
    })
  }, [bills, search])

  function handleSendReminder(bill: OutstandingBill) {
    setBills((prev) =>
      prev.map((b) => (b.invoiceId === bill.invoiceId ? { ...b, lastReminderSent: new Date().toISOString() } : b))
    )
    const patient = getPatientById(bill.patientId)
    toast.success(`Reminder sent for ${bill.invoiceId}`, {
      description: patient ? `${patient.name} will be notified of the outstanding balance.` : undefined,
    })
  }

  function openRecordPayment(bill: OutstandingBill) {
    setPaying(bill)
    setPaymentAmount(String(bill.amountDue))
  }

  function submitPayment() {
    if (!paying) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount")
      return
    }
    const applied = Math.min(amount, paying.amountDue)
    setBills((prev) =>
      prev
        .map((b) => (b.invoiceId === paying.invoiceId ? { ...b, amountDue: b.amountDue - applied } : b))
        .filter((b) => b.amountDue > 0)
    )
    toast.success(`Payment of ${formatNaira(applied)} recorded for ${paying.invoiceId}`)
    setPaying(null)
    setPaymentAmount("")
  }

  const columns = getOutstandingColumns({ onSendReminder: handleSendReminder, onRecordPayment: openRecordPayment })

  return (
    <div>
      <PageHeader
        title="Outstanding Bills"
        description="Unpaid and partially paid invoices that need follow up"
        breadcrumbs={[
          { label: "Pharmacy & Finance" },
          { label: "Billing", href: "/billing" },
          { label: "Outstanding" },
        ]}
      />

      <BillingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Overdue Bills" value={overdueCount} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Total Amount Due" value={formatNaira(totalDue)} icon={WalletIcon} tone="amber" />
        <StatCard label="No Reminder Sent" value={noReminderCount} icon={ClockIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No outstanding bills"
        emptyDescription="All invoices are fully paid."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by invoice ID or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="sm:max-w-sm">
          {paying && (
            <>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  {paying.invoiceId} &middot; Amount Due {formatNaira(paying.amountDue)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="outstanding-payment-amount">Amount (₦)</Label>
                <Input
                  id="outstanding-payment-amount"
                  type="number"
                  min={1}
                  max={paying.amountDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaying(null)}>
                  Cancel
                </Button>
                <RoleGate permission="BILLING_RECEIVE_PAYMENT">
                  <Button onClick={submitPayment}>Confirm Payment</Button>
                </RoleGate>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { OutstandingList }
