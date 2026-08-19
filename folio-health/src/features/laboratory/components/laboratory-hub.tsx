"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  PlusIcon,
  SearchIcon,
  HourglassIcon,
  LoaderIcon,
  CheckCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { isToday } from "date-fns"
import {
  LAB_RESULTS,
  TEST_NAMES,
  TEST_CATEGORY_BY_NAME,
  type LabResult,
  type LabWorkflowStatus,
} from "@/lib/mock/laboratory"
import { getPatientById, PATIENTS } from "@/lib/mock/patients"
import { DOCTORS } from "@/lib/mock/staff"
import { getLabColumns } from "./lab-columns"

const TABS = ["All Results", "Pending", "In Progress", "Completed", "Approved"] as const

function LaboratoryHub() {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Results")
  const [search, setSearch] = useState("")
  const [localResults, setLocalResults] = useState<LabResult[]>([])
  const [overrides, setOverrides] = useState<Record<string, LabWorkflowStatus>>({})

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newDoctorId, setNewDoctorId] = useState("")
  const [newTestName, setNewTestName] = useState(TEST_NAMES[0] ?? "")

  const allResults = useMemo(() => [...localResults, ...LAB_RESULTS], [localResults])

  const rows = useMemo(
    () =>
      allResults.map((r) => {
        const overrideStatus = overrides[r.id]
        if (!overrideStatus) return r
        return {
          ...r,
          workflowStatus: overrideStatus,
          displayStatus: r.flag ?? overrideStatus,
          approvedAt: overrideStatus === "Approved" ? new Date().toISOString() : r.approvedAt,
          approvedBy: overrideStatus === "Approved" ? "You" : r.approvedBy,
        }
      }),
    [allResults, overrides]
  )

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.workflowStatus === "Pending").length
    const inProgress = rows.filter((r) => r.workflowStatus === "In Progress").length
    const completedToday = rows.filter((r) => r.resultAt && isToday(new Date(r.resultAt))).length
    const critical = rows.filter((r) => r.flag === "Critical").length
    return { pending, inProgress, completedToday, critical }
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab !== "All Results" && r.workflowStatus !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(r.patientId)
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.testName.toLowerCase().includes(q) &&
          !(patient?.name.toLowerCase().includes(q) ?? false) &&
          !(patient?.mrn.toLowerCase().includes(q) ?? false)
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, tab, search])

  function handleApprove(result: LabResult) {
    setOverrides((prev) => ({ ...prev, [result.id]: "Approved" }))
    toast.success(`${result.id} approved`, {
      description: `${result.testName} result has been approved and released.`,
    })
  }

  function handlePrint(result: LabResult) {
    toast.success(`Sending ${result.id} to printer...`)
  }

  function resetNewOrderForm() {
    setNewPatientId("")
    setNewDoctorId("")
    setNewTestName(TEST_NAMES[0] ?? "")
  }

  function handleCreateOrder() {
    if (!newPatientId || !newDoctorId || !newTestName) {
      toast.error("Select a patient, doctor, and test to place a lab order")
      return
    }
    const patient = getPatientById(newPatientId)
    const newResult: LabResult = {
      id: `LAB-local-${Date.now()}`,
      patientId: newPatientId,
      doctorId: newDoctorId,
      labScientistId: newDoctorId,
      testType: TEST_CATEGORY_BY_NAME[newTestName] ?? "General",
      testName: newTestName,
      parameters: [],
      resultSummary: "N/A",
      referenceRangeSummary: "N/A",
      flag: null,
      workflowStatus: "Pending",
      displayStatus: "Pending",
      orderedAt: new Date().toISOString(),
      collectedBy: null,
      collectedAt: null,
      resultAt: null,
      approvedAt: null,
      approvedBy: null,
      comments: "",
    }
    setLocalResults((prev) => [newResult, ...prev])
    toast.success("Lab order placed", {
      description: patient ? `${newTestName} ordered for ${patient.name}.` : undefined,
    })
    resetNewOrderForm()
    setNewOpen(false)
  }

  const columns = getLabColumns({ onApprove: handleApprove, onPrint: handlePrint })

  return (
    <div>
      <PageHeader
        title="Laboratory"
        description={`${allResults.length} lab results on record`}
        breadcrumbs={[{ label: "Diagnostics" }, { label: "Laboratory" }]}
        actions={
          <RoleGate permission="ORDER">
            <Button onClick={() => setNewOpen(true)}>
              <PlusIcon />
              New Lab Order
            </Button>
          </RoleGate>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={stats.pending} icon={HourglassIcon} tone="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={LoaderIcon} tone="violet" />
        <StatCard label="Completed Today" value={stats.completedToday} icon={CheckCheckIcon} tone="emerald" />
        <StatCard label="Critical Results" value={stats.critical} icon={TriangleAlertIcon} tone="red" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab((v as (typeof TABS)[number]) ?? "All Results")}>
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-md border border-transparent bg-muted/60 px-3 py-1.5 data-active:border-border data-active:bg-background"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(result) => router.push(`/laboratory/${result.id}`)}
        emptyTitle="No lab results found"
        emptyDescription="Try adjusting your search or filters, or place a new lab order."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by test ID, name, or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Lab Order</DialogTitle>
            <DialogDescription>Place a new laboratory test order for a patient.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lab-order-patient">Patient</Label>
              <Select value={newPatientId} onValueChange={(v) => setNewPatientId(v ?? "")}>
                <SelectTrigger id="lab-order-patient" className="w-full">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lab-order-doctor">Ordering doctor</Label>
              <Select value={newDoctorId} onValueChange={(v) => setNewDoctorId(v ?? "")}>
                <SelectTrigger id="lab-order-doctor" className="w-full">
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
              <Label htmlFor="lab-order-test">Test</Label>
              <Select value={newTestName} onValueChange={(v) => setNewTestName(v ?? TEST_NAMES[0] ?? "")}>
                <SelectTrigger id="lab-order-test" className="w-full">
                  <SelectValue placeholder="Select test" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <RoleGate permission="ORDER">
              <Button onClick={handleCreateOrder}>Place Order</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { LaboratoryHub }
