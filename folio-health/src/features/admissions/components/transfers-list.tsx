"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowRightLeftIcon, HourglassIcon, CheckCircle2Icon, CheckCheckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
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
import {
  useAdmissions,
  useAdvanceTransfer,
  useRequestTransfer,
  useTransfers,
  useWardsAndBeds,
  type TransferWithNames,
} from "../hooks/use-admissions"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import type { Transfer } from "@/lib/mock/admissions"
import { transfersColumns } from "./transfers-columns"

const ALL = "all"

function TransfersList() {
  const [status, setStatus] = useState(ALL)

  const [newOpen, setNewOpen] = useState(false)
  const [newAdmissionId, setNewAdmissionId] = useState("")
  const [newToWardId, setNewToWardId] = useState("")
  const [newReason, setNewReason] = useState("")

  const { data: rows = [], isLoading, isError } = useTransfers()
  const { data: activeAdmissions = [] } = useAdmissions(false)
  const { data: wardsAndBeds } = useWardsAndBeds()
  const requestTransfer = useRequestTransfer()
  const advanceTransfer = useAdvanceTransfer()
  const { data: user } = useCurrentUser()

  const wards = wardsAndBeds?.wards ?? []
  const selectedAdmission = activeAdmissions.find((a) => a.id === newAdmissionId)

  function resetNewTransferForm() {
    setNewAdmissionId("")
    setNewToWardId("")
    setNewReason("")
  }

  async function handleCreateTransfer() {
    if (!selectedAdmission || !newToWardId) {
      toast.error("Select a patient and a destination ward")
      return
    }
    // Only genuinely free beds: occupancy is derived from live encounters, so
    // this cannot request a move into a bed someone is already in.
    const destinationBed = (wardsAndBeds?.beds ?? []).find(
      (b) => b.wardId === newToWardId && b.status === "Available"
    )
    if (!destinationBed) {
      toast.error("That ward has no free beds")
      return
    }
    try {
      await requestTransfer.mutateAsync({
        patientId: selectedAdmission.patientId,
        encounterId: selectedAdmission.id,
        fromBedId: selectedAdmission.bedId,
        toBedId: destinationBed.id,
        reason: newReason.trim(),
        requester:
          user?.id && user.resourceType === "Practitioner"
            ? { reference: `Practitioner/${user.id}`, display: user.name }
            : undefined,
      })
      toast.success("Transfer requested", { description: "It is now pending approval." })
      resetNewTransferForm()
      setNewOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request the transfer")
    }
  }

  const filtered = useMemo(
    () => rows.filter((t) => status === ALL || t.status === status),
    [rows, status]
  )

  async function approve(transfer: Transfer) {
    try {
      await advanceTransfer.mutateAsync({ transferId: transfer.id, to: "Approved" })
      toast.success("Transfer approved", { description: "The move has not happened yet." })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve the transfer")
    }
  }

  async function complete(transfer: Transfer) {
    try {
      // This is the step that actually moves the patient between beds.
      await advanceTransfer.mutateAsync({ transferId: transfer.id, to: "Completed" })
      toast.success("Transfer completed", {
        description: `${(transfer as TransferWithNames).patientName ?? "The patient"} has been moved.`,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete the transfer")
    }
  }

  const columns = useMemo(() => transfersColumns(approve, complete), [])

  const pendingCount = rows.filter((t) => t.status === "Pending").length
  const approvedCount = rows.filter((t) => t.status === "Approved").length
  const completedCount = rows.filter((t) => t.status === "Completed").length

  return (
    <div>
      <PageHeader
        title="Patient Transfers"
        description={isLoading ? "Loading..." : `${rows.length} transfer requests on record`}
        breadcrumbs={[
          { label: "Inpatient" },
          { label: "Admissions", href: "/admissions" },
          { label: "Transfers" },
        ]}
        actions={
          <RoleGate roles={["doctor", "nurse"]}>
            <Button onClick={() => setNewOpen(true)}>
              <ArrowRightLeftIcon />
              New Transfer
            </Button>
          </RoleGate>
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
                    const wardName = wards.find((w) => w.id === a.wardId)?.name ?? "Unassigned"
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        {a.patientName ?? "Patient"} &middot; {wardName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedAdmission && (
              <p className="text-xs text-muted-foreground">
                Currently in{" "}
                <span className="font-medium text-foreground">
                  {wards.find((w) => w.id === selectedAdmission.wardId)?.name ?? "an unassigned ward"}
                </span>
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-to-ward">Transfer to ward</Label>
              <Select value={newToWardId} onValueChange={(v) => setNewToWardId(v ?? "")}>
                <SelectTrigger id="transfer-to-ward" className="w-full">
                  <SelectValue placeholder="Select destination ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards.filter((w) => w.id !== selectedAdmission?.wardId).map((w) => (
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
            <RoleGate roles={["doctor", "nurse"]}>
              <Button onClick={handleCreateTransfer}>Request Transfer</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { TransfersList }
