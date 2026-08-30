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
  TEST_NAMES,
  TEST_CATEGORY_BY_NAME,
  type LabResult,
} from "@/lib/mock/laboratory"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import {
  useApproveLabResult,
  useCreateLabOrder,
  useLabResults,
  type LabResultWithPatient,
} from "../hooks/use-laboratory"
import { getLabColumns } from "./lab-columns"

const TABS = ["All Results", "Pending", "In Progress", "Completed", "Approved"] as const

function LaboratoryHub() {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Results")
  const [search, setSearch] = useState("")

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newTestName, setNewTestName] = useState(TEST_NAMES[0] ?? "")

  const { data: rows = [], isLoading, isError, error } = useLabResults()
  const createOrder = useCreateLabOrder()
  const approveResult = useApproveLabResult()
  const { data: user } = useCurrentUser()
  // Only fetched while the order dialog is open — the table itself does not
  // need the patient list, so it never waits on it.
  const { data: patientData } = usePatients({}, newOpen)

  // The approving clinician is the signed-in user, not a picked one: approval
  // is an attestation, and letting the UI choose whose name goes on it would
  // make the audit trail meaningless.
  const approver =
    user?.id && user.resourceType === "Practitioner"
      ? { reference: `Practitioner/${user.id}` as const, display: user.name }
      : undefined

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
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.testName.toLowerCase().includes(q) &&
          !((r as LabResultWithPatient).patientName?.toLowerCase().includes(q) ?? false)
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, tab, search])

  async function handleApprove(result: LabResult) {
    try {
      await approveResult.mutateAsync({ reportId: result.id, performer: approver })
      toast.success("Result approved", {
        description: `${result.testName} has been approved and released.`,
      })
    } catch (approvalError) {
      toast.error(
        approvalError instanceof Error ? approvalError.message : "Could not approve the result"
      )
    }
  }

  function handlePrint(result: LabResult) {
    toast.success(`Sending ${result.id} to printer...`)
  }

  function resetNewOrderForm() {
    setNewPatientId("")
    setNewTestName(TEST_NAMES[0] ?? "")
  }

  async function handleCreateOrder() {
    if (!newPatientId || !newTestName) {
      toast.error("Select a patient and a test to place a lab order")
      return
    }
    try {
      // The ordering doctor is whoever is signed in. The old form asked the
      // user to pick one from a list, which let anyone attribute an order to
      // any doctor.
      await createOrder.mutateAsync({
        patientId: newPatientId,
        testName: newTestName,
        testCategory: TEST_CATEGORY_BY_NAME[newTestName],
        priority: "Routine",
        requester: approver,
      })
      toast.success("Lab order placed", { description: `${newTestName} has been ordered.` })
      resetNewOrderForm()
      setNewOpen(false)
    } catch (orderError) {
      toast.error(orderError instanceof Error ? orderError.message : "Could not place the order")
    }
  }

  const columns = getLabColumns({ onApprove: handleApprove, onPrint: handlePrint })

  return (
    <div>
      <PageHeader
        title="Laboratory"
        description={isLoading ? "Loading..." : `${rows.length} lab results on record`}
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
                  {(patientData?.patients ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} &middot; {p.mrn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ordering clinician</Label>
              {/*
                Stated, not chosen. The order is attributed to whoever is signed
                in — a picker here would let any user place an order in another
                doctor's name, which the FHIR requester field is supposed to
                answer truthfully.
              */}
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                {user?.name ?? "Signed-in clinician"}
              </p>
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
