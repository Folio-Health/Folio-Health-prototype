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
import { getPatientById, PATIENTS } from "@/lib/mock/patients"
import { DOCTORS } from "@/lib/mock/staff"
import {
  SURGERIES_LIST,
  THEATRES_LIST,
  todaysSurgeriesCount,
  completedTodayCount,
  inProgressCount,
  cancelledTodayCount,
} from "@/lib/mock/surgery"
import type { Surgery } from "@/lib/mock/surgery"
import { surgeryColumns } from "./surgery-columns"

const ALL = "all"

function SurgerySchedule() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [localSurgeries, setLocalSurgeries] = useState<Surgery[]>([])

  const [newOpen, setNewOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState("")
  const [newProcedure, setNewProcedure] = useState("")
  const [newSurgeonId, setNewSurgeonId] = useState("")
  const [newAnesthesiologistId, setNewAnesthesiologistId] = useState("")
  const [newTheatre, setNewTheatre] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newDuration, setNewDuration] = useState("60")

  const allSurgeries = useMemo(() => [...localSurgeries, ...SURGERIES_LIST], [localSurgeries])

  function resetNewSurgeryForm() {
    setNewPatientId("")
    setNewProcedure("")
    setNewSurgeonId("")
    setNewAnesthesiologistId("")
    setNewTheatre("")
    setNewDate("")
    setNewTime("")
    setNewDuration("60")
  }

  function handleScheduleSurgery() {
    if (!newPatientId || !newProcedure.trim() || !newSurgeonId || !newTheatre || !newDate || !newTime) {
      toast.error("Fill in patient, procedure, surgeon, theatre, date, and time")
      return
    }
    const scheduledTime = new Date(`${newDate}T${newTime}`).toISOString()
    const surgery: Surgery = {
      id: `SUR-local-${Date.now()}`,
      patientId: newPatientId,
      procedure: newProcedure.trim(),
      surgeonId: newSurgeonId,
      anesthesiologistId: newAnesthesiologistId || newSurgeonId,
      theatreNumber: Number(newTheatre),
      date: newDate,
      scheduledTime,
      durationMinutes: Number(newDuration) || 60,
      status: "Scheduled",
    }
    setLocalSurgeries((prev) => [surgery, ...prev])
    const patient = getPatientById(newPatientId)
    toast.success("Surgery scheduled", {
      description: `${newProcedure} for ${patient?.name ?? "patient"} added to Theatre ${newTheatre}.`,
    })
    resetNewSurgeryForm()
    setNewOpen(false)
  }

  const filtered = useMemo(() => {
    return allSurgeries.filter((s) => {
      if (status !== ALL && s.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(s.patientId)
        if (
          !s.procedure.toLowerCase().includes(q) &&
          !(patient?.name.toLowerCase().includes(q) ?? false) &&
          !(patient?.mrn.toLowerCase().includes(q) ?? false)
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
        <StatCard label="Scheduled Today" value={todaysSurgeriesCount()} icon={CalendarClockIcon} />
        <StatCard label="In Progress" value={inProgressCount()} icon={LoaderIcon} tone="violet" />
        <StatCard label="Completed Today" value={completedTodayCount()} icon={CheckCheckIcon} tone="emerald" />
        <StatCard label="Cancelled Today" value={cancelledTodayCount()} icon={XCircleIcon} tone="red" />
      </div>

      <DataTable
        columns={surgeryColumns}
        data={sortedByTime}
        emptyTitle="No surgeries found"
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
                  {PATIENTS.slice(0, 40).map((p) => (
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
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="surgery-surgeon">Surgeon</Label>
                <Select value={newSurgeonId} onValueChange={(v) => setNewSurgeonId(v ?? "")}>
                  <SelectTrigger id="surgery-surgeon" className="w-full">
                    <SelectValue placeholder="Select surgeon" />
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
                <Label htmlFor="surgery-anesthesiologist">Anesthesiologist</Label>
                <Select value={newAnesthesiologistId} onValueChange={(v) => setNewAnesthesiologistId(v ?? "")}>
                  <SelectTrigger id="surgery-anesthesiologist" className="w-full">
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
