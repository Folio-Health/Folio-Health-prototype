"use client"

import { useMemo, useState } from "react"
import { CalendarPlusIcon, Loader2Icon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PersonAvatar } from "@/components/common/person-avatar"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useBookAppointment, useBookablePractitioners } from "../hooks/use-appointments"

const DURATIONS = [
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "45 minutes", minutes: 45 },
  { label: "1 hour", minutes: 60 },
]

/**
 * Book (or rebook) an appointment.
 *
 * The dialog only COLLECTS the request — patient, practitioner, time. The
 * booking rules live in /api/appointments: the server re-checks conflicts,
 * stamps the facility, and (for a reschedule) cancels the original first.
 * A 409 from the double-booking check surfaces here as the error toast.
 */
function NewAppointmentDialog({
  rescheduleOf,
  trigger,
}: {
  /** When set, this booking replaces the given appointment (cancel + rebook). */
  rescheduleOf?: { id: string; patientId: string; patientDisplay?: string }
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [patientId, setPatientId] = useState(rescheduleOf?.patientId ?? "")
  const [patientDisplay, setPatientDisplay] = useState(rescheduleOf?.patientDisplay ?? "")
  const [practitionerId, setPractitionerId] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState("09:00")
  const [duration, setDuration] = useState(30)
  const [reason, setReason] = useState("")

  const isReschedule = Boolean(rescheduleOf)
  const search = patientSearch.trim()
  const { data: patientResults, isFetching: searching } = usePatients(
    { search },
    open && !isReschedule && search.length >= 2
  )
  const { data: practitioners, isPending: loadingPractitioners } = useBookablePractitioners()
  const book = useBookAppointment()

  const candidates = useMemo(
    () => (patientResults?.patients ?? []).slice(0, 6),
    [patientResults]
  )
  const selectedPractitioner = practitioners?.find((p) => p.id === practitionerId)

  function reset() {
    setPatientSearch("")
    if (!isReschedule) {
      setPatientId("")
      setPatientDisplay("")
    }
    setPractitionerId("")
    setReason("")
  }

  async function handleBook() {
    if (!patientId) {
      toast.error("Choose a patient first.")
      return
    }
    if (!practitionerId) {
      toast.error("Choose a practitioner.")
      return
    }
    const start = new Date(`${date}T${time}:00`)
    if (Number.isNaN(start.getTime())) {
      toast.error("Pick a valid date and time.")
      return
    }
    const end = new Date(start.getTime() + duration * 60_000)
    try {
      await book.mutateAsync({
        patientId,
        patientDisplay,
        practitionerId,
        practitionerDisplay: selectedPractitioner?.name,
        start: start.toISOString(),
        end: end.toISOString(),
        reason,
        rescheduleOf: rescheduleOf?.id,
      })
      toast.success(isReschedule ? "Appointment rescheduled" : "Appointment booked", {
        description: `${patientDisplay || "Patient"} · ${start.toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
      })
      setOpen(false)
      reset()
    } catch (error) {
      toast.error(
        isReschedule ? "Could not reschedule" : "Could not book the appointment",
        { description: error instanceof Error ? error.message : "Try again." }
      )
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button>
            <CalendarPlusIcon />
            New Appointment
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isReschedule ? "Reschedule appointment" : "New appointment"}</DialogTitle>
            <DialogDescription>
              {isReschedule
                ? "Books a new time and cancels the original — the link between the two is kept."
                : "Booked directly as confirmed. Double-booking a practitioner is refused."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {!isReschedule && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="apt-patient">Patient</Label>
                {patientId ? (
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <PersonAvatar name={patientDisplay || "Patient"} size="sm" />
                      <span className="text-sm font-medium">{patientDisplay}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setPatientId("")
                        setPatientDisplay("")
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="apt-patient"
                        className="pl-8"
                        placeholder="Search registered patients by name…"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                    {search.length >= 2 && (
                      <div className="flex flex-col rounded-lg border border-border">
                        {searching && candidates.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                        ) : candidates.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">
                            No registered patient matches. Register them at Reception first.
                          </p>
                        ) : (
                          candidates.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                              onClick={() => {
                                setPatientId(p.id)
                                setPatientDisplay(p.name)
                                setPatientSearch("")
                              }}
                            >
                              <PersonAvatar name={p.name} size="sm" />
                              <span className="font-medium">{p.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {p.dob ?? ""}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Practitioner</Label>
              <Select value={practitionerId} onValueChange={(v) => setPractitionerId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={loadingPractitioners ? "Loading doctors…" : "Select a doctor"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(practitioners ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {practitioners?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No doctors at your facility yet — the hospital admin creates them under
                  Administration → Users.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="apt-date">Date</Label>
                <Input
                  id="apt-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="apt-time">Time</Label>
                <Input
                  id="apt-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Duration</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v ?? 30))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.minutes} value={String(d.minutes)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="apt-reason">Reason for visit</Label>
              <Input
                id="apt-reason"
                placeholder="e.g. Follow-up, chest pain, antenatal review"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleBook()} disabled={book.isPending}>
              {book.isPending && <Loader2Icon className="animate-spin" />}
              {isReschedule ? "Reschedule" : "Book appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { NewAppointmentDialog }
