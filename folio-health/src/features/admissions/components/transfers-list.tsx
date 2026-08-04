"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowRightLeftIcon, HourglassIcon, CheckCircle2Icon, CheckCheckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getPatientById } from "@/lib/mock/patients"
import {
  TRANSFERS_LIST,
  WARDS_LIST,
  getActiveAdmissions,
  getBedsByWard,
  getWardById,
} from "@/lib/mock/admissions"
import type { Transfer, TransferStatus } from "@/lib/mock/admissions"
import { transfersColumns } from "./transfers-columns"

const ALL = "all"

function TransfersList() {
  const [status, setStatus] = useState(ALL)
  const [overrides, setOverrides] = useState<Record<string, TransferStatus>>({})
  const [localTransfers, setLocalTransfers] = useState<Transfer[]>([])

  const [newOpen, setNewOpen] = useState(false)
  const [newAdmissionId, setNewAdmissionId] = useState("")
  const [newToWardId, setNewToWardId] = useState("")
  const [newReason, setNewReason] = useState("")

  const activeAdmissions = useMemo(() => getActiveAdmissions(), [])
  const selectedAdmission = activeAdmissions.find((a) => a.id === newAdmissionId)

  function resetNewTransferForm() {
    setNewAdmissionId("")
    setNewToWardId("")
    setNewReason("")
  }

  function handleCreateTransfer() {
    if (!selectedAdmission || !newToWardId) {
      toast.error("Select a patient and a destination ward")
      return
    }
    const destinationBeds = getBedsByWard(newToWardId).filter((b) => b.status === "Available")
    const transfer: Transfer = {
      id: `TRF-local-${Date.now()}`,
      patientId: selectedAdmission.patientId,
      fromWardId: selectedAdmission.wardId,
      fromBedId: selectedAdmission.bedId,
      toWardId: newToWardId,
      toBedId: destinationBeds[0]?.id ?? "",
      requestedBy: "You",
      reason: newReason.trim() || "Ward reassignment",
      date: new Date().toISOString(),
      status: "Pending",
    }
    setLocalTransfers((prev) => [transfer, ...prev])
    const patient = getPatientById(selectedAdmission.patientId)
    toast.success("Transfer requested", {
      description: `${patient?.name ?? "Patient"}'s transfer to ${getWardById(newToWardId)?.name ?? "the new ward"} is pending approval.`,
    })
    resetNewTransferForm()
    setNewOpen(false)
  }

  const allTransfers = useMemo(() => [...localTransfers, ...TRANSFERS_LIST], [localTransfers])

  const rows = useMemo(
    () => allTransfers.map((t) => ({ ...t, status: overrides[t.id] ?? t.status })),
    [allTransfers, overrides]
  )

  const filtered = useMemo(
    () => rows.filter((t) => status === ALL || t.status === status),
    [rows, status]
  )

  function approve(transfer: Transfer) {
    setOverrides((prev) => ({ ...prev, [transfer.id]: "Approved" }))
    const patient = getPatientById(transfer.patientId)
    toast.success(`Transfer approved`, { description: `${patient?.name ?? "Patient"}'s transfer is now approved.` })
  }

  function complete(transfer: Transfer) {
    setOverrides((prev) => ({ ...prev, [transfer.id]: "Completed" }))
    const patient = getPatientById(transfer.patientId)
    toast.success(`Transfer completed`, { description: `${patient?.name ?? "Patient"} has been moved to the new ward.` })
  }

  const columns = useMemo(() => transfersColumns(approve, complete), [])

  const pendingCount = rows.filter((t) => t.status === "Pending").length
  const approvedCount = rows.filter((t) => t.status === "Approved").length
  const completedCount = rows.filter((t) => t.status === "Completed").length

  return (
    <div>
      <PageHeader
        title="Patient Transfers"
        description={`${allTransfers.length} transfer requests on record`}
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Transfers" },
        ]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <ArrowRightLeftIcon />
            New Transfer
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Approval" value={pendingCount} icon={HourglassIcon} tone="amber" />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2Icon} tone="violet" />
        <StatCard label="Completed" value={completedCount} icon={CheckCheckIcon} tone="emerald" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No transfers found"
        emptyDescription="Try adjusting your filters, or request a new transfer."
        toolbar={
          <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Transfer Request</DialogTitle>
            <DialogDescription>Move an admitted patient to a different ward.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-patient">Patient (currently admitted)</Label>
              <Select value={newAdmissionId} onValueChange={(v) => setNewAdmissionId(v ?? "")}>
                <SelectTrigger id="transfer-patient" className="w-full">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {activeAdmissions.map((a) => {
                    const patient = getPatientById(a.patientId)
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        {patient?.name ?? a.patientId} &middot; {getWardById(a.wardId)?.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedAdmission && (
              <p className="text-xs text-muted-foreground">
                Currently in <span className="font-medium text-foreground">{getWardById(selectedAdmission.wardId)?.name}</span>
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-to-ward">Transfer to ward</Label>
              <Select value={newToWardId} onValueChange={(v) => setNewToWardId(v ?? "")}>
                <SelectTrigger id="transfer-to-ward" className="w-full">
                  <SelectValue placeholder="Select destination ward" />
                </SelectTrigger>
                <SelectContent>
                  {WARDS_LIST.filter((w) => w.id !== selectedAdmission?.wardId).map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-reason">Reason</Label>
              <Textarea
                id="transfer-reason"
                placeholder="e.g. Requires closer monitoring in ICU"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransfer}>Request Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { TransfersList }
