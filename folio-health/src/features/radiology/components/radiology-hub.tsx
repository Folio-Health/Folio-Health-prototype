"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, SearchIcon, HourglassIcon, LoaderIcon, CheckCheckIcon, TriangleAlertIcon } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  IMAGING_REQUESTS,
  RADIOLOGY_REPORTS,
  MODALITIES,
  BODY_PARTS_BY_MODALITY,
  RADIOLOGISTS,
  type Modality,
  type ImagingRequest,
} from "@/lib/mock/radiology"
import { getPatientById, PATIENTS } from "@/lib/mock/patients"
import { DOCTORS } from "@/lib/mock/staff"
import { getRadiologyColumns } from "./radiology-columns"

const MODALITY_TABS: (Modality | "All")[] = ["All", "X-ray", "MRI", "CT Scan", "Ultrasound"]

function RadiologyHub() {
  const router = useRouter()
  const [tab, setTab] = useState<Modality | "All">("All")
  const [search, setSearch] = useState("")
  const [localRequests, setLocalRequests] = useState<ImagingRequest[]>([])

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newDoctorId, setNewDoctorId] = useState("")
  const [newModality, setNewModality] = useState<Modality>(MODALITIES[0])
  const [newBodyPart, setNewBodyPart] = useState(BODY_PARTS_BY_MODALITY[MODALITIES[0]][0])
  const [newIndication, setNewIndication] = useState("")

  const allRequests = useMemo(() => [...localRequests, ...IMAGING_REQUESTS], [localRequests])

  const stats = useMemo(() => {
    const pending = allRequests.filter((r) => r.status === "Pending").length
    const inProgress = allRequests.filter((r) => r.status === "In Progress").length
    const completedToday = RADIOLOGY_REPORTS.filter((r) => isToday(new Date(r.date))).length
    const critical = RADIOLOGY_REPORTS.filter((r) => r.severity === "Critical").length
    return { pending, inProgress, completedToday, critical }
  }, [allRequests])

  const filtered = useMemo(() => {
    return allRequests.filter((r) => {
      if (tab !== "All" && r.modality !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(r.patientId)
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.bodyPart.toLowerCase().includes(q) &&
          !(patient?.name.toLowerCase().includes(q) ?? false) &&
          !(patient?.mrn.toLowerCase().includes(q) ?? false)
        ) {
          return false
        }
      }
      return true
    })
  }, [allRequests, tab, search])

  function handlePrint(request: ImagingRequest) {
    toast.success(`Sending ${request.id} to printer...`)
  }

  function resetNewRequestForm() {
    setNewPatientId("")
    setNewDoctorId("")
    setNewModality(MODALITIES[0])
    setNewBodyPart(BODY_PARTS_BY_MODALITY[MODALITIES[0]][0])
    setNewIndication("")
  }

  function handleCreateRequest() {
    if (!newPatientId || !newDoctorId || !newBodyPart) {
      toast.error("Select a patient, doctor, and body part to request imaging")
      return
    }
    const patient = getPatientById(newPatientId)
    const newRequest: ImagingRequest = {
      id: `RAD-local-${Date.now()}`,
      patientId: newPatientId,
      doctorId: newDoctorId,
      radiologistId: RADIOLOGISTS[0]?.id ?? newDoctorId,
      modality: newModality,
      bodyPart: newBodyPart,
      clinicalIndication: newIndication.trim() || "Clinical evaluation requested",
      orderedAt: new Date().toISOString(),
      status: "Pending",
      priority: "Routine",
      imageIds: [],
    }
    setLocalRequests((prev) => [newRequest, ...prev])
    toast.success("Imaging request created", {
      description: patient ? `${newModality} (${newBodyPart}) ordered for ${patient.name}.` : undefined,
    })
    resetNewRequestForm()
    setNewOpen(false)
  }

  const columns = getRadiologyColumns({ onPrint: handlePrint })

  return (
    <div>
      <PageHeader
        title="Radiology"
        description={`${allRequests.length} imaging studies on record`}
        breadcrumbs={[{ label: "Diagnostics" }, { label: "Radiology" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <PlusIcon />
            New Imaging Request
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Studies" value={stats.pending} icon={HourglassIcon} tone="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={LoaderIcon} tone="violet" />
        <StatCard label="Completed Today" value={stats.completedToday} icon={CheckCheckIcon} tone="emerald" />
        <StatCard label="Critical Findings" value={stats.critical} icon={TriangleAlertIcon} tone="red" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab((v as Modality | "All") ?? "All")}>
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {MODALITY_TABS.map((t) => (
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
        onRowClick={(request) => router.push(`/radiology/${request.id}`)}
        emptyTitle="No imaging studies found"
        emptyDescription="Try adjusting your search or filters, or create a new imaging request."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by study ID, body part, or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Imaging Request</DialogTitle>
            <DialogDescription>Order a new radiology study for a patient.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="imaging-patient">Patient</Label>
              <Select value={newPatientId} onValueChange={(v) => setNewPatientId(v ?? "")}>
                <SelectTrigger id="imaging-patient" className="w-full">
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
                <Label htmlFor="imaging-modality">Modality</Label>
                <Select
                  value={newModality}
                  onValueChange={(v) => {
                    const modality = (v as Modality) ?? MODALITIES[0]
                    setNewModality(modality)
                    setNewBodyPart(BODY_PARTS_BY_MODALITY[modality][0])
                  }}
                >
                  <SelectTrigger id="imaging-modality" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITIES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="imaging-bodypart">Body Part</Label>
                <Select value={newBodyPart} onValueChange={(v) => setNewBodyPart(v ?? newBodyPart)}>
                  <SelectTrigger id="imaging-bodypart" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PARTS_BY_MODALITY[newModality].map((bp) => (
                      <SelectItem key={bp} value={bp}>
                        {bp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="imaging-doctor">Requesting doctor</Label>
              <Select value={newDoctorId} onValueChange={(v) => setNewDoctorId(v ?? "")}>
                <SelectTrigger id="imaging-doctor" className="w-full">
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
              <Label htmlFor="imaging-indication">Clinical indication</Label>
              <Textarea
                id="imaging-indication"
                placeholder="e.g. Persistent cough and chest pain"
                value={newIndication}
                onChange={(e) => setNewIndication(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { RadiologyHub }
