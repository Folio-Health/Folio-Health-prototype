"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { TruckIcon, NavigationIcon, MapPinIcon, CheckCircle2Icon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useAmbulanceDispatches, useCreateDispatch } from "../hooks/use-emergency"
import type { AmbulanceDispatch } from "@/lib/mock/emergency"
import { ambulanceColumns } from "./ambulance-columns"

const ALL = "all"

const DESTINATIONS = [
  "Folio Health General Hospital - ER Bay 1",
  "Folio Health General Hospital - ER Bay 2",
  "Folio Health General Hospital - ER Bay 3",
  "Folio Health General Hospital - Trauma Bay",
]

function AmbulanceTracking() {
  const [status, setStatus] = useState(ALL)

  const [newOpen, setNewOpen] = useState(false)
  const [newAmbulanceId, setNewAmbulanceId] = useState("")
  const [newDestination, setNewDestination] = useState("")
  const [newPatientId, setNewPatientId] = useState("")
  const [newEta, setNewEta] = useState("15")

  const { data: allDispatches = [], isLoading, isError } = useAmbulanceDispatches()
  const createDispatch = useCreateDispatch()
  // Only fetched while the dispatch dialog is open.
  const { data: patientData } = usePatients({}, newOpen)

  function resetNewDispatchForm() {
    setNewAmbulanceId("")
    setNewDestination("")
    setNewPatientId("")
    setNewEta("15")
  }

  async function handleDispatch() {
    if (!newAmbulanceId.trim() || !newDestination) {
      toast.error("Enter an ambulance unit and destination")
      return
    }
    try {
      await createDispatch.mutateAsync({
        ambulanceId: newAmbulanceId.trim(),
        status: "Dispatched",
        destination: newDestination,
        // Blank means "no ETA recorded" rather than defaulting to a number the
        // dispatcher never gave.
        etaMinutes: newEta.trim() ? Number(newEta) : undefined,
        patient: newPatientId ? { reference: `Patient/${newPatientId}` } : undefined,
      })
      toast.success("Dispatch request sent", {
        description: `${newAmbulanceId.trim()} dispatched to ${newDestination}.`,
      })
      resetNewDispatchForm()
      setNewOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the dispatch")
    }
  }

  const filtered = useMemo(
    () => allDispatches.filter((a) => status === ALL || a.status === status),
    [allDispatches, status]
  )

  const dispatched = allDispatches.filter((a) => a.status === "Dispatched").length
  const enRoute = allDispatches.filter((a) => a.status === "En Route").length
  const arrived = allDispatches.filter((a) => a.status === "Arrived").length
  const available = allDispatches.filter((a) => a.status === "Available").length

  return (
    <div>
      <PageHeader
        title="Ambulance Tracking"
        description={isLoading ? "Loading..." : `${allDispatches.length} dispatches on record`}
        breadcrumbs={[{ label: "Emergency", href: "/emergency" }, { label: "Ambulance Tracking" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <TruckIcon />
            Dispatch Ambulance
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Dispatched" value={dispatched} icon={TruckIcon} tone="amber" />
        <StatCard label="En Route" value={enRoute} icon={NavigationIcon} tone="primary" />
        <StatCard label="Arrived" value={arrived} icon={MapPinIcon} tone="violet" />
        <StatCard label="Available" value={available} icon={CheckCircle2Icon} tone="emerald" />
      </div>

      <DataTable
        columns={ambulanceColumns}
        data={filtered}
        emptyTitle="No ambulances found"
        emptyDescription="Try adjusting your filters."
        toolbar={
          <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              <SelectItem value="Dispatched">Dispatched</SelectItem>
              <SelectItem value="En Route">En Route</SelectItem>
              <SelectItem value="Arrived">Arrived</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch Ambulance</DialogTitle>
            <DialogDescription>Send an ambulance unit to a pickup or transfer destination.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ambulance-unit">Ambulance unit</Label>
              <Input
                id="ambulance-unit"
                placeholder="e.g. AMB-109"
                value={newAmbulanceId}
                onChange={(e) => setNewAmbulanceId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ambulance-destination">Destination</Label>
              <Select value={newDestination} onValueChange={(v) => setNewDestination(v ?? "")}>
                <SelectTrigger id="ambulance-destination" className="w-full">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ambulance-patient">Patient (optional)</Label>
              <Select value={newPatientId} onValueChange={(v) => setNewPatientId(v ?? "")}>
                <SelectTrigger id="ambulance-patient" className="w-full">
                  <SelectValue placeholder="No patient linked yet" />
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
              <Label htmlFor="ambulance-eta">ETA (min)</Label>
              <Input
                id="ambulance-eta"
                type="number"
                min={1}
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDispatch}>Dispatch Ambulance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AmbulanceTracking }
