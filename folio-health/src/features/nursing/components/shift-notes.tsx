"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { PlusIcon, ClipboardListIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { Textarea } from "@/components/ui/textarea"
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
  DialogClose,
} from "@/components/ui/dialog"
import { NursingModuleTabs } from "./nursing-module-tabs"
import { SHIFT_NOTES, NURSING_ASSIGNMENTS, type ShiftNote, type Shift } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById, NURSES } from "@/lib/mock/staff"
import { id as makeId } from "@/lib/mock/seed"

const SHIFT_TONE: Record<Shift, "blue" | "amber" | "violet"> = {
  Morning: "blue",
  Evening: "amber",
  Night: "violet",
}

function ShiftNotes() {
  const [notes, setNotes] = useState<ShiftNote[]>(SHIFT_NOTES)
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState<string>("")
  const [shift, setShift] = useState<Shift>("Morning")
  const [text, setText] = useState("")

  const patientOptions = useMemo(
    () =>
      NURSING_ASSIGNMENTS.map((a) => getPatientById(a.patientId)).filter(
        (p): p is NonNullable<typeof p> => !!p
      ),
    []
  )

  function handleSubmit() {
    if (!patientId || !text.trim()) {
      toast.error("Please select a patient and enter a note.")
      return
    }
    const newNote: ShiftNote = {
      id: makeId("SFN-NEW", notes.length + 1),
      patientId,
      nurseId: NURSES[0]?.id ?? "",
      shift,
      time: new Date().toISOString(),
      note: text.trim(),
    }
    setNotes((prev) => [newNote, ...prev])
    setOpen(false)
    setText("")
    setPatientId("")
    toast.success("Shift note saved", { description: "The handover note has been added to the log." })
  }

  return (
    <div>
      <PageHeader
        title="Shift Handover Notes"
        description="Nurse to nurse handover notes by patient and shift"
        breadcrumbs={[{ label: "Clinical" }, { label: "Nursing", href: "/nursing" }, { label: "Shift Notes" }]}
        actions={
          <RoleGate roles={["nurse"]}>
            <Button onClick={() => setOpen(true)}>
              <PlusIcon />
              New Shift Note
            </Button>
          </RoleGate>
        }
      />

      <NursingModuleTabs />

      {notes.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No shift notes yet"
          description="Handover notes recorded by nursing staff will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => {
            const patient = getPatientById(note.patientId)
            const nurse = getStaffById(note.nurseId)
            return (
              <Card key={note.id}>
                <CardContent className="flex items-start gap-3">
                  <PersonAvatar name={nurse?.name ?? "Nurse"} seed={nurse?.avatarSeed} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{nurse?.name ?? "Unknown Nurse"}</span>
                      <StatusBadge status={note.shift} tone={SHIFT_TONE[note.shift]} />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.time), "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Patient: <span className="text-foreground">{patient?.name ?? "Unknown"}</span> &middot; {patient?.mrn}
                    </p>
                    <p className="text-sm text-foreground">{note.note}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Shift Note</DialogTitle>
            <DialogDescription>Record a handover note for the next shift.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-note-patient">Patient</Label>
              <Select value={patientId} onValueChange={(v) => setPatientId(v ?? "")}>
                <SelectTrigger id="shift-note-patient" className="w-full">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} &middot; {p.mrn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-note-shift">Shift</Label>
              <Select value={shift} onValueChange={(v) => setShift((v as Shift) ?? "Morning")}>
                <SelectTrigger id="shift-note-shift" className="w-full">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-note-text">Note</Label>
              <Textarea
                id="shift-note-text"
                placeholder="Summarize patient condition, interventions, and anything the next shift should know..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <RoleGate roles={["nurse"]}>
              <Button onClick={handleSubmit}>Save Note</Button>
            </RoleGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ShiftNotes }
