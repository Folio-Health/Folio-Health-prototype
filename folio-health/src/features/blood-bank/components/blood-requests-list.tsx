"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { PlusIcon, SearchIcon, CheckIcon, XIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
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
import {
  BLOOD_REQUESTS,
  BLOOD_GROUPS,
  REQUESTING_DEPTS,
  type BloodRequest,
  type RequestStatus,
  type RequestUrgency,
} from "@/lib/mock/blood-bank"
import { getPatientById, PATIENTS } from "@/lib/mock/patients"
import { getBloodRequestColumns } from "./blood-request-columns"

const ALL = "all"
const URGENCIES: RequestUrgency[] = ["Routine", "Urgent", "Emergency"]

function BloodRequestsList() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [localRequests, setLocalRequests] = useState<BloodRequest[]>([])
  const [overrides, setOverrides] = useState<Record<string, RequestStatus>>({})
  const [viewing, setViewing] = useState<BloodRequest | null>(null)

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newBloodType, setNewBloodType] = useState(BLOOD_GROUPS[0])
  const [newUnits, setNewUnits] = useState("1")
  const [newDepartment, setNewDepartment] = useState(REQUESTING_DEPTS[0] ?? "")
  const [newUrgency, setNewUrgency] = useState<RequestUrgency>("Routine")
  const [newRequestedBy, setNewRequestedBy] = useState("")

  const allRequests = useMemo(() => [...localRequests, ...BLOOD_REQUESTS], [localRequests])

  const rows = useMemo(
    () => allRequests.map((r) => (overrides[r.id] ? { ...r, status: overrides[r.id] } : r)),
    [allRequests, overrides]
  )

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== ALL && r.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(r.patientId)
        if (
          !r.id.toLowerCase().includes(q) &&
          !(patient?.name.toLowerCase().includes(q) ?? false) &&
          !r.requestedBy.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, search, status])

  function updateStatus(request: BloodRequest, next: RequestStatus) {
    setOverrides((prev) => ({ ...prev, [request.id]: next }))
    toast.success(`${request.id} ${next === "Approved" ? "approved" : "rejected"}`)
  }

  function resetNewRequestForm() {
    setNewPatientId("")
    setNewBloodType(BLOOD_GROUPS[0])
    setNewUnits("1")
    setNewDepartment(REQUESTING_DEPTS[0] ?? "")
    setNewUrgency("Routine")
    setNewRequestedBy("")
  }

  function handleCreateRequest() {
    const units = Number(newUnits)
    if (!newPatientId || !newDepartment || !units || units <= 0) {
      toast.error("Select a patient and department, and enter a valid unit count")
      return
    }
    const patient = getPatientById(newPatientId)
    const newRequest: BloodRequest = {
      id: `BRQ-local-${Date.now()}`,
      department: newDepartment,
      patientId: newPatientId,
      bloodType: newBloodType,
      unitsRequested: units,
      urgency: newUrgency,
      status: "Pending",
      requestedAt: new Date().toISOString(),
      requestedBy: newRequestedBy.trim() || "You",
    }
    setLocalRequests((prev) => [newRequest, ...prev])
    toast.success("Blood request submitted", {
      description: patient ? `${units} unit(s) of ${newBloodType} requested for ${patient.name}.` : undefined,
    })
    resetNewRequestForm()
    setNewOpen(false)
  }

  const columns = getBloodRequestColumns({
    onView: setViewing,
    onApprove: (r) => updateStatus(r, "Approved"),
    onReject: (r) => updateStatus(r, "Rejected"),
  })
  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined
  const viewingStatus = viewing ? overrides[viewing.id] ?? viewing.status : undefined

  return (
    <div>
      <PageHeader
        title="Blood Requests"
        description={`${allRequests.length} requests on record`}
        breadcrumbs={[
          { label: "Diagnostics" },
          { label: "Blood Bank", href: "/blood-bank" },
          { label: "Requests" },
        ]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <PlusIcon />
            New Request
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(request) => setViewing(request)}
        emptyTitle="No blood requests found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by request ID or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Fulfilled">Fulfilled</SelectItem>
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
                <DialogDescription>{format(new Date(viewing.requestedAt), "dd MMM yyyy")}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  {viewingPatient && (
                    <PersonAvatar name={viewingPatient.name} seed={viewingPatient.avatarSeed} size="sm" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{viewingPatient?.name ?? "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{viewing.department}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Blood Group</span>
                    <span className="font-medium text-foreground">{viewing.bloodType}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Units Requested</span>
                    <span className="font-medium text-foreground">{viewing.unitsRequested}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Urgency</span>
                    <span className="font-medium text-foreground">{viewing.urgency}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Requested By</span>
                    <span className="font-medium text-foreground">{viewing.requestedBy}</span>
                  </div>
                </div>
                <StatusBadge status={viewingStatus ?? viewing.status} className="w-fit" />
              </div>
              <DialogFooter showCloseButton>
                {viewingStatus === "Pending" && (
                  <>
                    <Button variant="outline" onClick={() => updateStatus(viewing, "Rejected")}>
                      <XIcon />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        updateStatus(viewing, "Approved")
                        setViewing(null)
                      }}
                    >
                      <CheckIcon />
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Blood Request</DialogTitle>
            <DialogDescription>Request blood units from the blood bank for a patient.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="request-patient">Patient</Label>
              <Select value={newPatientId} onValueChange={(v) => setNewPatientId(v ?? "")}>
                <SelectTrigger id="request-patient" className="w-full">
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
                <Label htmlFor="request-bloodtype">Blood Group</Label>
                <Select value={newBloodType} onValueChange={(v) => setNewBloodType(v ?? BLOOD_GROUPS[0])}>
                  <SelectTrigger id="request-bloodtype" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="request-units">Units</Label>
                <Input
                  id="request-units"
                  type="number"
                  min={1}
                  max={10}
                  value={newUnits}
                  onChange={(e) => setNewUnits(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="request-department">Department</Label>
                <Select value={newDepartment} onValueChange={(v) => setNewDepartment(v ?? newDepartment)}>
                  <SelectTrigger id="request-department" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUESTING_DEPTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="request-urgency">Urgency</Label>
                <Select value={newUrgency} onValueChange={(v) => setNewUrgency((v as RequestUrgency) ?? "Routine")}>
                  <SelectTrigger id="request-urgency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCIES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="request-by">Requested by</Label>
              <Input
                id="request-by"
                placeholder="e.g. Dr. Adaeze Okonkwo"
                value={newRequestedBy}
                onChange={(e) => setNewRequestedBy(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { BloodRequestsList }
