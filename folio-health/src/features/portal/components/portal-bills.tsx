"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DownloadIcon, WalletIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPortalInvoices } from "@/lib/mock/portal"
import { formatNaira, type Invoice } from "@/lib/mock/billing"

function downloadInvoice(invoice: Invoice) {
  const lines = [
    `Folio Health EMR: Invoice ${invoice.id}`,
    `Date: ${format(new Date(invoice.date), "MMM d, yyyy")}`,
    `Department: ${invoice.department}`,
    "",
    "Items:",
    ...invoice.items.map((it) => `  - ${it.description} x${it.qty} @ ${formatNaira(it.unitPrice)}`),
    "",
    `Total: ${formatNaira(invoice.amount)}`,
    `Paid: ${formatNaira(invoice.paid)}`,
    `Balance: ${formatNaira(invoice.balance)}`,
    `Status: ${invoice.status}`,
  ].join("\n")
  const blob = new Blob([lines], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${invoice.id}-invoice.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function PortalBills() {
  const [invoices, setInvoices] = useState<Invoice[]>(getPortalInvoices())
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)

  function confirmPayment() {
    if (!payingInvoice) return
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === payingInvoice.id ? { ...inv, paid: inv.amount, balance: 0, status: "Paid" } : inv
      )
    )
    toast.success(`Payment received for ${payingInvoice.id}`, {
      description: "A receipt has been emailed to you.",
    })
    setPayingInvoice(null)
  }

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id}</span>,
      },
      {
        accessorKey: "date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{format(new Date(row.original.date), "MMM d, yyyy")}</span>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => <span className="text-foreground">{row.original.department}</span>,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatNaira(row.original.amount)}</span>,
      },
      {
        accessorKey: "balance",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
        cell: ({ row }) => (
          <span
            className={
              row.original.balance > 0
                ? "font-medium tabular-nums text-foreground"
                : "tabular-nums text-muted-foreground"
            }
          >
            {formatNaira(row.original.balance)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const invoice = row.original
          return (
            <div className="flex items-center justify-end gap-1.5">
              {invoice.balance > 0 && (
                <Button size="sm" className="gap-1.5" onClick={() => setPayingInvoice(invoice)}>
                  <WalletIcon className="size-3.5" />
                  Pay
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => downloadInvoice(invoice)}
              >
                <DownloadIcon className="size-3.5" />
                Download
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const outstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0)

  return (
    <div>
      <PageHeader
        title="Bills"
        description={`Outstanding balance: ${formatNaira(outstanding)}`}
      />

      <DataTable
        columns={columns}
        data={invoices}
        emptyTitle="No invoices yet"
        emptyDescription="Invoices for your visits and services will appear here."
      />

      <Dialog open={payingInvoice !== null} onOpenChange={(open) => !open && setPayingInvoice(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pay Invoice {payingInvoice?.id}</DialogTitle>
            <DialogDescription>
              You&apos;re about to pay {payingInvoice ? formatNaira(payingInvoice.balance) : ""} on this invoice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingInvoice(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PortalBills }
