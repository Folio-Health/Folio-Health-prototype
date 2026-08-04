"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { SearchIcon, FileTextIcon, ClockIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
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
import { BillingModuleTabs } from "./billing-module-tabs"
import { getClaimColumns } from "./claim-columns"
import { CLAIMS, formatNaira, type Claim } from "@/lib/mock/billing"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"

function ClaimsList() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [viewing, setViewing] = useState<Claim | null>(null)

  const submittedCount = CLAIMS.filter((c) => c.status === "Submitted" || c.status === "Under Review").length
  const approvedCount = CLAIMS.filter((c) => c.status === "Approved").length
  const rejectedCount = CLAIMS.filter((c) => c.status === "Rejected").length
  const totalApproved = CLAIMS.reduce((sum, c) => sum + c.amountApproved, 0)

  const filtered = useMemo(() => {
    return CLAIMS.filter((c) => {
      if (status !== ALL && c.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(c.patientId)
        if (
          !c.id.toLowerCase().includes(q) &&
          !c.insurer.toLowerCase().includes(q) &&
          !patient?.name.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [status, search])

  function handleFollowUp(claim: Claim) {
    toast.success(`Follow-up sent to ${claim.insurer}`, { description: `Regarding claim ${claim.id}.` })
  }

  const columns = getClaimColumns({ onView: setViewing, onFollowUp: handleFollowUp })
  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined

  return (
    <div>
      <PageHeader
        title="Insurance Claims"
        description="Claims submitted to insurers on behalf of patients"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Billing", href: "/billing" }, { label: "Claims" }]}
      />

      <BillingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="In Progress" value={submittedCount} icon={ClockIcon} tone="amber" />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircleIcon} tone="red" />
        <StatCard label="Total Approved Value" value={formatNaira(totalApproved)} icon={FileTextIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(claim) => setViewing(claim)}
        emptyTitle="No claims found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by claim ID, insurer, or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-sm">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.id}</DialogTitle>
                <DialogDescription>{format(new Date(viewing.date), "dd MMM yyyy")}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  {viewingPatient && (
                    <PersonAvatar name={viewingPatient.name} seed={viewingPatient.avatarSeed} size="sm" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{viewingPatient?.name ?? "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{viewing.invoiceId}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Insurer</span>
                    <span className="font-medium text-foreground">{viewing.insurer}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <StatusBadge status={viewing.status} className="w-fit" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Amount Claimed</span>
                    <span className="font-medium text-foreground">{formatNaira(viewing.amountClaimed)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Amount Approved</span>
                    <span className="font-medium text-foreground">
                      {viewing.amountApproved > 0 ? formatNaira(viewing.amountApproved) : "N/A"}
                    </span>
                  </div>
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

export { ClaimsList }
