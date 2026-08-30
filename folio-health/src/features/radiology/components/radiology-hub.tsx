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
  MODALITIES,
  BODY_PARTS_BY_MODALITY,
  type Modality,
  type ImagingRequest,
} from "@/lib/mock/radiology"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import {
  useCreateImagingOrder,
  useImagingRequests,
  type ImagingRequestWithPatient,
} from "../hooks/use-radiology"
import { getRadiologyColumns } from "./radiology-columns"

const MODALITY_TABS: (Modality | "All")[] = ["All", "X-ray", "MRI", "CT Scan", "Ultrasound"]

function RadiologyHub() {
  const router = useRouter()
  const [tab, setTab] = useState<Modality | "All">("All")
  const [search, setSearch] = useState("")

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newModality, setNewModality] = useState<Modality>(MODALITIES[0])
  const [newBodyPart, setNewBodyPart] = useState(BODY_PARTS_BY_MODALITY[MODALITIES[0]][0])
  const [newIndication, setNewIndication] = useState("")

  const { data: allRequests = [], isLoading, isError } = useImagingRequests()
  const createOrder = useCreateImagingOrder()
  const { data: user } = useCurrentUser()
  const { data: patientData } = usePatients({}, newOpen)

  const stats = useMemo(() => {
    const pending = allRequests.filter((r) => r.status === "Pending").length
    const inProgress = allRequests.filter((r) => r.status === "In Progress").length
    // "Reported today" is derived from the exams themselves rather than from a
    // separate report list, so the figure cannot disagree with the table.
    const completedToday = allRequests.filter(
      (r) => r.status === "Reported" && r.orderedAt && isToday(new Date(r.orderedAt))
    ).length
    const critical = allRequests.filter((r) => r.priority === "STAT").length
    return { pending, inProgress, completedToday, critical }
  }, [allRequests])

  const filtered = useMemo(() => {
    return allRequests.filter((r) => {
      if (tab !== "All" && r.modality !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.bodyPart.toLowerCase().includes(q) &&
          !((r as ImagingRequestWithPatient).patientName?.toLowerCase().includes(q) ?? false)
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
    setNewModality(MODALITIES[0])
    setNewBodyPart(BODY_PARTS_BY_MODALITY[MODALITIES[0]][0])
    setNewIndication("")
  }

  async function handleCreateRequest() {
    if (!newPatientId || !newBodyPart) {
      toast.error("Select a patient and a body part to request imaging")
      return
    }
    try {
      // Attributed to the signed-in clinician, not a picked one — the FHIR
      // requester field is meant to say who actually ordered the exam.
      await createOrder.mutateAsync({
        patientId: newPatientId,
        modality: newModality,
        bodyPart: newBodyPart,
        clinicalIndication: newIndication.trim() || undefined,
        priority: "Routine",
        requester:
          user?.id && user.resourceType === "Practitioner"
            ? { reference: `Practitioner/${user.id}`, display: user.name }
            : undefined,
      })
      toast.success("Imaging request created", {
        description: `${newModality} (${newBodyPart}) has been ordered.`,
      })
      resetNewRequestForm()
      setNewOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the request")
    }
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
              <Label>Requesting clinician</Label>
              {/* Stated, not chosen — see the lab order dialog for the reasoning. */}
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                {user?.name ?? "Signed-in clinician"}
              </p>
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
