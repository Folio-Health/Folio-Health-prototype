"use client"

import { useState } from "react"
import { SearchIcon, WalletIcon, BanknoteIcon, CreditCardIcon, LandmarkIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { BillingModuleTabs } from "./billing-module-tabs"
import { paymentColumns } from "./payment-columns"
import { PAYMENTS, formatNaira } from "@/lib/mock/billing"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"

function PaymentsList() {
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState(ALL)

  const totalCollected = PAYMENTS.reduce((sum, p) => sum + p.amount, 0)
  const cashTotal = PAYMENTS.filter((p) => p.method === "Cash").reduce((sum, p) => sum + p.amount, 0)
  const cardTotal = PAYMENTS.filter((p) => p.method === "Card").reduce((sum, p) => sum + p.amount, 0)
  const transferTotal = PAYMENTS.filter((p) => p.method === "Transfer" || p.method === "Insurance").reduce(
    (sum, p) => sum + p.amount,
    0
  )

  const filtered = PAYMENTS.filter((p) => {
    if (method !== ALL && p.method !== method) return false
    if (search) {
      const q = search.toLowerCase()
      const patient = getPatientById(p.patientId)
      if (
        !p.id.toLowerCase().includes(q) &&
        !p.invoiceId.toLowerCase().includes(q) &&
        !patient?.name.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every payment transaction recorded against patient invoices"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Billing", href: "/billing" }, { label: "Payments" }]}
      />

      <BillingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Collected" value={formatNaira(totalCollected)} icon={WalletIcon} />
        <StatCard label="Cash Payments" value={formatNaira(cashTotal)} icon={BanknoteIcon} tone="emerald" />
        <StatCard label="Card Payments" value={formatNaira(cardTotal)} icon={CreditCardIcon} tone="violet" />
        <StatCard label="Transfer / Insurance" value={formatNaira(transferTotal)} icon={LandmarkIcon} tone="amber" />
      </div>

      <DataTable
        columns={paymentColumns}
        data={filtered}
        emptyTitle="No payments found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by payment ID, invoice, or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={method} onValueChange={(v) => setMethod(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { PaymentsList }
