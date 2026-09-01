"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, SearchIcon, CalendarClockIcon, LoaderIcon, CheckCheckIcon, XCircleIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
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
import { THEATRES_LIST } from "@/lib/mock/surgery"
import type { Surgery } from "@/lib/mock/surgery"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useScheduleSurgery, useSurgeries, type SurgeryWithPatient } from "../hooks/use-surgery"
import { surgeryColumns } from "./surgery-columns"

const ALL = "all"

function SurgerySchedule() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newProcedure, setNewProcedure] = useState("")
  const [newTheatre, setNewTheatre] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newDuration, setNewDuration] = useState("60")

  const { data: allSurgeries = [], isLoading, isError } = useSurgeries()
  const scheduleSurgery = useScheduleSurgery()
  const { data: user } = useCurrentUser()
  const { data: patientData } = usePatients({}, newOpen)

  const today = new Date().toDateString()
  const isToday = (s: Surgery) => s.date && new Date(s.date).toDateString() === today
  const todaysSurgeriesCount = allSurgeries.filter(isToday).length
  const completedTodayCount = allSurgeries.filter((s) => isToday(s) && s.status === "Completed").length
  const inProgressCount = allSurgeries.filter((s) => s.status === "In Progress").length
  const cancelledTodayCount = allSurgeries.filter((s) => isToday(s) && s.status === "Cancelled").length

  function resetNewSurgeryForm() {
    setNewPatientId("")
    setNewProcedure("")
    setNewTheatre("")
    setNewDate("")
    setNewTime("")
    setNewDuration("60")
  }

  async function handleScheduleSurgery() {
    if (!newPatientId || !newProcedure.trim() || !newTheatre || !newDate || !newTime) {
      toast.error("Fill in patient, procedure, theatre, date and time")
      return
    }
    try {
      // The surgeon is the signed-in clinician. The old form let anyone book an
      // operation in another surgeon's name.
      await scheduleSurgery.mutateAsync({
        patientId: newPatientId,
        procedure: newProcedure.trim(),
        theatreNumber: Number(newTheatre),
        scheduledStart: new Date(`${newDate}T${newTime}`).toISOString(),
        durationMinutes: Number(newDuration) || 60,
        surgeon:
          user?.id && user.resourceType === "Practitioner"
            ? { reference: `Practitioner/${user.id}`, display: user.name }
            : undefined,
      })
      toast.success("Surgery scheduled", {
        description: `${newProcedure} added to Theatre ${newTheatre}.`,
      })
      resetNewSurgeryForm()
      setNewOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule the surgery")
    }
  }

  const filtered = useMemo(() => {
    return allSurgeries.filter((s) => {
      if (status !== ALL && s.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !s.procedure.toLowerCase().includes(q) &&
          !((s as SurgeryWithPatient).patientName?.toLowerCase().includes(q) ?? false)
        ) {
          return false
        }
      }
      return true
    })
  }, [allSurgeries, search, status])

  const sortedByTime = useMemo(
    () => [...filtered].sort((a, b) => +new Date(a.scheduledTime) - +new Date(b.scheduledTime)),
    [filtered]
  )

  return (
    <div>
      <PageHeader
        title="Surgery Schedule"
        description={`${allSurgeries.length} procedures on the calendar`}
        breadcrumbs={[{ label: "Surgery" }, { label: "Schedule" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <PlusIcon />
            Schedule Surgery
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scheduled Today" value={todaysSurgeriesCount} icon={CalendarClockIcon} />
        <StatCard label="In Progress" value={inProgressCount} icon={LoaderIcon} tone="violet" />
        <StatCard label="Completed Today" value={completedTodayCount} icon={CheckCheckIcon} tone="emerald" />
        <StatCard label="Cancelled Today" value={cancelledTodayCount} icon={XCircleIcon} tone="red" />
      </div>

      <DataTable
        columns={surgeryColumns}
        data={sortedByTime}
        isLoading={isLoading}
        emptyTitle={isError ? "Could not load the schedule" : "No surgeries found"}
        emptyDescription="Try adjusting your search or filters, or schedule a new procedure."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by procedure or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        pageSize={10}
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Surgery</DialogTitle>
            <DialogDescription>Book a procedure and assign it to a theatre.</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="surgery-patient">Patient</Label>
              <Select value={newPatientId} onValueChange={(v) => setNewPatientId(v ?? "")}>
                <SelectTrigger id="surgery-patient" className="w-full">
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
              <Label htmlFor="surgery-procedure">Procedure</Label>
              <Input
                id="surgery-procedure"
                placeholder="e.g. Appendectomy"
                value={newProcedure}
                onChange={(e) => setNewProcedure(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Surgeon</Label>
              {/*
                Stated, not chosen. Procedure.performer records who actually
                operated; a picker would let anyone book in another surgeon's
                name. An anaesthetist can be added when the theatre team is
                assigned — inventing one at booking time would name a clinician
                who has not agreed to the case.
              */}
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                {user?.name ?? "Signed-in clinician"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="surgery-theatre">Theatre</Label>
              <Select value={newTheatre} onValueChange={(v) => setNewTheatre(v ?? "")}>
                <SelectTrigger id="surgery-theatre" className="w-full">
                  <SelectValue placeholder="Select theatre" />
                </SelectTrigger>
                <SelectContent>
                  {THEATRES_LIST.map((t) => (
                    <SelectItem key={t.number} value={String(t.number)}>
                      Theatre {t.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="surgery-date">Date</Label>
                <Input
                  id="surgery-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="surgery-time">Time</Label>
                <Input
                  id="surgery-time"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="surgery-duration">Duration (min)</Label>
                <Input
                  id="surgery-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <RoleGate roles={["doctor"]}>
              <Button onClick={handleScheduleSurgery}>Schedule Surgery</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { SurgerySchedule }
