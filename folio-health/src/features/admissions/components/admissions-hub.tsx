"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  PlusIcon,
  SearchIcon,
  BedDoubleIcon,
  LogInIcon,
  LogOutIcon,
  ClockIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
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
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import {
  useAdmissions,
  useAdmitPatient,
  useDischargePatient,
  useWardsAndBeds,
  type AdmissionWithPatient,
} from "../hooks/use-admissions"
import type { Admission } from "@/lib/mock/admissions"
import { admissionsColumns } from "./admissions-columns"

const ALL = "all"

function AdmissionsHub() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [ward, setWard] = useState(ALL)
  const [pendingDischarge, setPendingDischarge] = useState<Admission | null>(null)

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newWardId, setNewWardId] = useState("")
  const [newBedId, setNewBedId] = useState("")
  const [newDiagnosis, setNewDiagnosis] = useState("")

  // Discharged admissions are included so the list can show history; the
  // status filter below narrows it.
  const { data: rows = [], isLoading, isError } = useAdmissions(true)
  const { data: wardsAndBeds } = useWardsAndBeds()
  const wards = wardsAndBeds?.wards ?? []
  const admitPatient = useAdmitPatient()
  const dischargePatient = useDischargePatient()
  const { data: user } = useCurrentUser()
  const { data: patientData } = usePatients({}, newOpen)

  const todaysAdmissionsCount = useMemo(() => {
    const today = new Date().toDateString()
    return rows.filter((a) => a.admissionDate && new Date(a.admissionDate).toDateString() === today)
      .length
  }, [rows])

  const todaysDischargesCount = useMemo(() => {
    const today = new Date().toDateString()
    return rows.filter((a) => a.dischargeDate && new Date(a.dischargeDate).toDateString() === today)
      .length
  }, [rows])

  /** Mean stay in days over DISCHARGED admissions only — an open stay has no length yet. */
  const averageLengthOfStay = useMemo(() => {
    const closed = rows.filter((a) => a.admissionDate && a.dischargeDate)
    if (closed.length === 0) return 0
    const totalDays = closed.reduce((sum, a) => {
      const start = new Date(a.admissionDate).getTime()
      const end = new Date(a.dischargeDate as string).getTime()
      return sum + (end - start) / 86_400_000
    }, 0)
    return Math.round((totalDays / closed.length) * 10) / 10
  }, [rows])

  // Only beds that are genuinely free: occupancy is derived from live
  // encounters, so this cannot offer a bed someone is already in.
  const availableBedsForNewWard = newWardId
    ? (wardsAndBeds?.beds ?? []).filter((b) => b.wardId === newWardId && b.status === "Available")
    : []

  function resetNewAdmissionForm() {
    setNewPatientId("")
    setNewWardId("")
    setNewBedId("")
    setNewDiagnosis("")
  }

  async function handleCreateAdmission() {
    if (!newPatientId || !newWardId || !newBedId) {
      toast.error("Choose a patient, ward and bed to admit")
      return
    }
    try {
      // The admitting doctor is the signed-in clinician, not a picked one.
      await admitPatient.mutateAsync({
        patientId: newPatientId,
        bedId: newBedId,
        diagnosis: newDiagnosis.trim(),
        doctor:
          user?.id && user.resourceType === "Practitioner"
            ? { reference: `Practitioner/${user.id}`, display: user.name }
            : undefined,
      })
      toast.success("Patient admitted", {
        description: "They now appear in the active admissions list.",
      })
      resetNewAdmissionForm()
      setNewOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not admit the patient")
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      if (status !== ALL && a.status !== status) return false
      if (ward !== ALL && a.wardId !== ward) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(a as AdmissionWithPatient).patientName?.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [rows, search, status, ward])

  function handleDischarge(admission: Admission) {
    setPendingDischarge(admission)
  }

  async function confirmDischarge() {
    if (!pendingDischarge) return
    try {
      await dischargePatient.mutateAsync(pendingDischarge.id)
      toast.success("Patient discharged", {
        description: "The admission is closed and the bed is free again.",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not discharge the patient")
    } finally {
      setPendingDischarge(null)
    }
  }

  const wardNames = useMemo(() => new Map(wards.map((w) => [w.id, w.name])), [wards])
  const bedNames = useMemo(
    () => new Map((wardsAndBeds?.beds ?? []).map((b) => [b.id, b.label])),
    [wardsAndBeds]
  )
  const columns = useMemo(
    () => admissionsColumns(handleDischarge, { wards: wardNames, beds: bedNames }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wardNames, bedNames]
  )
  const activeCount = rows.filter((a) => a.status === "Admitted").length

  return (
    <div>
      <PageHeader
        title="Admissions"
        description={isLoading ? "Loading..." : `${rows.length} admission records on file`}
        breadcrumbs={[{ label: "Inpatient" }, { label: "Admissions" }]}
        actions={
          <RoleGate roles={["doctor", "nurse"]}>
            <Button onClick={() => setNewOpen(true)}>
              <PlusIcon />
              New Admission
            </Button>
          </RoleGate>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Admissions" value={activeCount} icon={BedDoubleIcon} />
        <StatCard label="Today's Admissions" value={todaysAdmissionsCount} icon={LogInIcon} tone="emerald" />
        <StatCard label="Today's Discharges" value={todaysDischargesCount} icon={LogOutIcon} tone="amber" />
        <StatCard
          label="Avg. Length of Stay"
          value={`${averageLengthOfStay}d`}
          icon={ClockIcon}
          tone="violet"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle={isError ? "Could not load admissions" : "No admissions found"}
        emptyDescription="Try adjusting your search or filters, or admit a new patient."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by patient or MRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={ward} onValueChange={(v) => setWard(v ?? ALL)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Wards</SelectItem>
                {wards.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="Discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <RoleGate roles={["doctor", "nurse"]}>
        <ConfirmDialog
          open={pendingDischarge !== null}
          onOpenChange={(open) => !open && setPendingDischarge(null)}
          title="Discharge patient?"
          description={
            pendingDischarge
              ? `This will discharge ${(pendingDischarge as AdmissionWithPatient).patientName ?? "this patient"} and free their bed.`
              : ""
          }
          confirmLabel="Discharge"
          destructive={false}
          onConfirm={confirmDischarge}
        />
      </RoleGate>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Admission</DialogTitle>
            <DialogDescription>Admit a patient and assign them to a ward and bed.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admission-patient">Patient</Label>
              <Select value={newPatientId} onValueChange={(v) => setNewPatientId(v ?? "")}>
                <SelectTrigger id="admission-patient" className="w-full">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {(patientData?.patients ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} &middot; {p.mrn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admission-ward">Ward</Label>
                <Select
                  value={newWardId}
                  onValueChange={(v) => {
                    setNewWardId(v ?? "")
                    setNewBedId("")
                  }}
                >
                  <SelectTrigger id="admission-ward" className="w-full">
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admission-bed">Bed</Label>
                <Select value={newBedId} onValueChange={(v) => setNewBedId(v ?? "")} disabled={!newWardId}>
                  <SelectTrigger id="admission-bed" className="w-full">
                    <SelectValue placeholder={newWardId ? "Select bed" : "Choose ward first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBedsForNewWard.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label}
                      </SelectItem>
                    ))}
                    {newWardId && availableBedsForNewWard.length === 0 && (
                      <SelectItem value="__none" disabled>
                        No available beds
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Admitting clinician</Label>
              {/* Stated, not chosen — the encounter records who actually admitted. */}
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                {user?.name ?? "Signed-in clinician"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admission-diagnosis">Diagnosis / reason</Label>
              <Input
                id="admission-diagnosis"
                placeholder="e.g. Community-acquired pneumonia"
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <RoleGate roles={["doctor", "nurse"]}>
              <Button onClick={handleCreateAdmission}>Admit Patient</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Looking for bed-level detail? Visit{" "}
        <Link href="/admissions/beds" className="text-primary hover:underline">
          Bed Allocation
        </Link>
        ,{" "}
        <Link href="/admissions/wards" className="text-primary hover:underline">
          Ward Management
        </Link>
        , or the{" "}
        <Link href="/admissions/icu" className="text-primary hover:underline">
          ICU Dashboard
        </Link>
        .
      </p>
    </div>
  )
}

export { AdmissionsHub }
