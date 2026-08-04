"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { SearchIcon, ReceiptIcon, WalletIcon, TriangleAlertIcon, TrendingUpIcon, WalletCardsIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { BillingModuleTabs } from "./billing-module-tabs"
import { getInvoiceColumns } from "./invoice-columns"
import { INVOICES, formatNaira, type Invoice, type InvoiceStatus } from "@/lib/mock/billing"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"

function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [viewing, setViewing] = useState<Invoice | null>(null)
  const [paying, setPaying] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((i) => i.status === "Paid").length
  const outstandingInvoices = invoices.filter((i) => i.balance > 0).length
  const totalRevenue = invoices.reduce((sum, i) => sum + i.paid, 0)

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (status !== ALL && inv.status !== status) return false
      if (fromDate && inv.date.slice(0, 10) < fromDate) return false
      if (toDate && inv.date.slice(0, 10) > toDate) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(inv.patientId)
        if (!inv.id.toLowerCase().includes(q) && !patient?.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [invoices, status, fromDate, toDate, search])

  function handlePrint(invoice: Invoice) {
    toast.success(`Sending ${invoice.id} to printer...`)
  }

  function openRecordPayment(invoice: Invoice) {
    setPaying(invoice)
    setPaymentAmount(String(invoice.balance))
  }

  function submitPayment() {
    if (!paying) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount")
      return
    }
    const applied = Math.min(amount, paying.balance)
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== paying.id) return inv
        const paid = inv.paid + applied
        const balance = inv.amount - paid
        const nextStatus: InvoiceStatus = balance <= 0 ? "Paid" : "Partial"
        return { ...inv, paid, balance, status: nextStatus }
      })
    )
    toast.success(`Payment of ${formatNaira(applied)} recorded for ${paying.id}`)
    setPaying(null)
    setPaymentAmount("")
  }

  const columns = getInvoiceColumns({ onView: setViewing, onRecordPayment: openRecordPayment, onPrint: handlePrint })
  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Patient invoices, payments, and outstanding balances"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Billing" }]}
      />

      <BillingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Invoices" value={totalInvoices} icon={ReceiptIcon} />
        <StatCard label="Paid Invoices" value={paidInvoices} icon={WalletIcon} tone="emerald" />
        <StatCard label="Outstanding" value={outstandingInvoices} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} icon={TrendingUpIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(invoice) => setViewing(invoice)}
        emptyTitle="No invoices found"
        emptyDescription="Try adjusting your search, filters, or date range."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
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
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                aria-label="From date"
                className="h-9 w-36"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                aria-label="To date"
                className="h-9 w-36"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.id}</DialogTitle>
                <DialogDescription>
                  {viewing.department} &middot; {format(new Date(viewing.date), "dd MMM yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5">
                  {viewingPatient && (
                    <PersonAvatar name={viewingPatient.name} seed={viewingPatient.avatarSeed} size="sm" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {viewingPatient?.name ?? "Unknown patient"}
                    </span>
                    <span className="text-xs text-muted-foreground">{viewingPatient?.mrn}</span>
                  </div>
                </div>
                <StatusBadge status={viewing.status} />
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-9 px-3">Description</TableHead>
                      <TableHead className="h-9 px-3 text-right">Qty</TableHead>
                      <TableHead className="h-9 px-3 text-right">Unit Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewing.items.map((item, i) => (
                      <TableRow key={`${item.description}-${i}`}>
                        <TableCell className="px-3 py-2 font-medium text-foreground">{item.description}</TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums">{item.qty}</TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums">{formatNaira(item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-1.5 px-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium text-foreground">{formatNaira(viewing.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-foreground">{formatNaira(viewing.paid)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1.5">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold text-foreground">{formatNaira(viewing.balance)}</span>
                </div>
              </div>

              <DialogFooter showCloseButton>
                {viewing.balance > 0 && (
                  <Button
                    onClick={() => {
                      setViewing(null)
                      openRecordPayment(viewing)
                    }}
                  >
                    <WalletCardsIcon />
                    Record Payment
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="sm:max-w-sm">
          {paying && (
            <>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  {paying.id} &middot; Balance {formatNaira(paying.balance)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payment-amount">Amount (₦)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min={1}
                  max={paying.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaying(null)}>
                  Cancel
                </Button>
                <Button onClick={submitPayment}>Confirm Payment</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { InvoicesList }
