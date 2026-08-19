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
import { getPatientById } from "@/lib/mock/patients"
import { PATIENTS } from "@/lib/mock/patients"
import { DOCTORS } from "@/lib/mock/staff"
import {
  ADMISSIONS_LIST,
  WARDS_LIST,
  averageLengthOfStay,
  getBedsByWard,
  todaysAdmissionsCount,
  todaysDischargesCount,
} from "@/lib/mock/admissions"
import type { Admission, AdmissionStatus } from "@/lib/mock/admissions"
import { admissionsColumns } from "./admissions-columns"

const ALL = "all"

function AdmissionsHub() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [ward, setWard] = useState(ALL)
  const [overrides, setOverrides] = useState<Record<string, AdmissionStatus>>({})
  const [pendingDischarge, setPendingDischarge] = useState<Admission | null>(null)
  const [localAdmissions, setLocalAdmissions] = useState<Admission[]>([])

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newWardId, setNewWardId] = useState("")
  const [newBedId, setNewBedId] = useState("")
  const [newDoctorId, setNewDoctorId] = useState("")
  const [newDiagnosis, setNewDiagnosis] = useState("")

  const allAdmissions = useMemo(
    () => [...localAdmissions, ...ADMISSIONS_LIST],
    [localAdmissions]
  )

  const rows = useMemo(
    () => allAdmissions.map((a) => ({ ...a, status: overrides[a.id] ?? a.status })),
    [allAdmissions, overrides]
  )

  const availableBedsForNewWard = newWardId ? getBedsByWard(newWardId).filter((b) => b.status === "Available") : []

  function resetNewAdmissionForm() {
    setNewPatientId("")
    setNewWardId("")
    setNewBedId("")
    setNewDoctorId("")
    setNewDiagnosis("")
  }

  function handleCreateAdmission() {
    if (!newPatientId || !newWardId || !newBedId || !newDoctorId) {
      toast.error("Fill in patient, ward, bed, and doctor to admit a patient")
      return
    }
    const patient = getPatientById(newPatientId)
    const admission: Admission = {
      id: `ADM-local-${Date.now()}`,
      patientId: newPatientId,
      wardId: newWardId,
      bedId: newBedId,
      doctorId: newDoctorId,
      admissionDate: new Date().toISOString(),
      diagnosis: newDiagnosis.trim() || "Under evaluation",
      status: "Admitted",
    }
    setLocalAdmissions((prev) => [admission, ...prev])
    toast.success(`${patient?.name ?? "Patient"} admitted`, {
      description: "The patient now appears in the active admissions list.",
    })
    resetNewAdmissionForm()
    setNewOpen(false)
  }

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      if (status !== ALL && a.status !== status) return false
      if (ward !== ALL && a.wardId !== ward) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(a.patientId)
        if (
          !patient?.name.toLowerCase().includes(q) &&
          !patient?.mrn.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, search, status, ward])

  function handleDischarge(admission: Admission) {
    setPendingDischarge(admission)
  }

  function confirmDischarge() {
    if (!pendingDischarge) return
    setOverrides((prev) => ({ ...prev, [pendingDischarge.id]: "Discharged" }))
    const patient = getPatientById(pendingDischarge.patientId)
    toast.success(`${patient?.name ?? "Patient"} discharged`, {
      description: "The bed has been marked for cleaning and the admission closed.",
    })
    setPendingDischarge(null)
  }

  const columns = useMemo(() => admissionsColumns(handleDischarge), [])
  const activeCount = rows.filter((a) => a.status === "Admitted").length

  return (
    <div>
      <PageHeader
        title="Admissions"
        description={`${allAdmissions.length} admission records on file`}
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
        <StatCard label="Today's Admissions" value={todaysAdmissionsCount()} icon={LogInIcon} tone="emerald" />
        <StatCard label="Today's Discharges" value={todaysDischargesCount()} icon={LogOutIcon} tone="amber" />
        <StatCard
          label="Avg. Length of Stay"
          value={`${averageLengthOfStay()}d`}
          icon={ClockIcon}
          tone="violet"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No admissions found"
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
                {WARDS_LIST.map((w) => (
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
              ? `This will discharge ${getPatientById(pendingDischarge.patientId)?.name ?? "this patient"} and free up their bed for cleaning.`
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
                  {PATIENTS.slice(0, 40).map((p) => (
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
                    {WARDS_LIST.map((w) => (
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
              <Label htmlFor="admission-doctor">Admitting doctor</Label>
              <Select value={newDoctorId} onValueChange={(v) => setNewDoctorId(v ?? "")}>
                <SelectTrigger id="admission-doctor" className="w-full">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {DOCTORS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
