"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  BanIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  RotateCcwIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { Appointment } from "@medplum/fhirtypes"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { RoleGate } from "@/components/common/role-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CANCEL_REASONS,
  allowedActions,
  appointmentPatient,
  appointmentPractitioner,
  type AppointmentAction,
  type AppointmentStatus,
} from "@/lib/appointments/logic"
import { useAppointmentAction, useAppointmentsForDay } from "../hooks/use-appointments"
import { NewAppointmentDialog } from "./new-appointment-dialog"

/** Roles that operate the schedule; everyone else views it. */
const SCHEDULERS = ["front-desk", "facility-admin"] as const

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  booked: "bg-secondary text-secondary-foreground",
  arrived: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  fulfilled: "bg-primary/10 text-primary",
  cancelled: "bg-muted text-muted-foreground line-through",
  noshow: "bg-destructive/10 text-destructive",
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: "Booked",
  arrived: "Arrived",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  noshow: "No-show",
}

const ACTION_META: Record<
  AppointmentAction,
  { label: string; icon: React.ComponentType<{ className?: string }>; variant?: "outline" | "ghost" }
> = {
  "check-in": { label: "Check in", icon: UserCheckIcon },
  "undo-check-in": { label: "Undo check-in", icon: RotateCcwIcon, variant: "ghost" },
  fulfill: { label: "Fulfil", icon: CheckCircle2Icon, variant: "outline" },
  cancel: { label: "Cancel", icon: BanIcon, variant: "ghost" },
  "no-show": { label: "No-show", icon: UserXIcon, variant: "ghost" },
}

function statusOf(a: Appointment): AppointmentStatus {
  const s = a.status as AppointmentStatus
  return s in STATUS_LABELS ? s : "booked"
}

/**
 * The facility's schedule for one day.
 *
 * The list is real FHIR data under the viewer's own facility-scoped policy;
 * the action buttons render only what the state machine allows for each row
 * (lib/appointments/logic.ts) and only for scheduling roles — and the server
 * route re-checks both, so the UI is presentation, not the boundary.
 * "No-show" is deliberately a button, never a timeout: marking it is the
 * front desk's decision, exactly as production schedulers work.
 */
function AppointmentsView() {
  const [day, setDay] = useState(() => new Date())
  const { data: appointments, isPending } = useAppointmentsForDay(day)
  const act = useAppointmentAction()
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0])
  const [cancelNote, setCancelNote] = useState("")

  const rows = useMemo(() => appointments ?? [], [appointments])
  const counts = useMemo(() => {
    const c: Record<AppointmentStatus, number> = {
      booked: 0,
      arrived: 0,
      fulfilled: 0,
      cancelled: 0,
      noshow: 0,
    }
    for (const a of rows) c[statusOf(a)] += 1
    return c
  }, [rows])

  function shiftDay(delta: number) {
    setDay((d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + delta)
      return next
    })
  }

  async function runAction(appointment: Appointment, action: AppointmentAction, reason?: string) {
    try {
      await act.mutateAsync({ id: appointment.id as string, action, reason })
      const patient = appointmentPatient(appointment)?.display ?? "Patient"
      toast.success(
        {
          "check-in": `${patient} checked in`,
          "undo-check-in": `Check-in undone for ${patient}`,
          fulfill: `Visit fulfilled for ${patient}`,
          cancel: `Appointment cancelled for ${patient}`,
          "no-show": `${patient} marked as no-show`,
        }[action]
      )
    } catch (error) {
      toast.error("Could not update the appointment", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }

  const isToday = day.toDateString() === new Date().toDateString()

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="The facility schedule — booked → arrived → fulfilled, with cancellations and no-shows kept on the record"
        breadcrumbs={[{ label: "Front Desk" }, { label: "Appointments" }]}
        actions={
          <RoleGate roles={[...SCHEDULERS]}>
            <NewAppointmentDialog />
          </RoleGate>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => shiftDay(-1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant={isToday ? "default" : "outline"} onClick={() => setDay(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next day" onClick={() => shiftDay(1)}>
            <ChevronRightIcon />
          </Button>
          <p className="ml-2 text-sm font-medium text-foreground">
            {format(day, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) =>
            counts[s] > 0 ? (
              <Badge key={s} variant="outline" className="text-xs">
                {STATUS_LABELS[s]}: {counts[s]}
              </Badge>
            ) : null
          )}
        </div>
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : appointments === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Appointments are not available for your role.
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarDaysIcon}
          title={isToday ? "Nothing booked today" : "Nothing booked this day"}
          description="Booked appointments appear here in start-time order."
        />
      ) : (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2">
          {rows.map((appointment) => {
            const status = statusOf(appointment)
            const patient = appointmentPatient(appointment)
            const practitioner = appointmentPractitioner(appointment)
            const actions = allowedActions(status)
            return (
              <div
                key={appointment.id}
                className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50"
              >
                <span className="w-24 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                  {appointment.start ? format(new Date(appointment.start), "HH:mm") : "—"}
                  {appointment.end ? `–${format(new Date(appointment.end), "HH:mm")}` : ""}
                </span>
                <PersonAvatar name={patient?.display ?? "Patient"} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">
                    {patient?.display ?? patient?.reference ?? "Unknown patient"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {practitioner?.display ?? practitioner?.reference ?? "Unassigned"}
                    {appointment.description ? ` · ${appointment.description}` : ""}
                    {status === "cancelled" && appointment.cancelationReason?.text
                      ? ` · ${appointment.cancelationReason.text}`
                      : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                <RoleGate roles={[...SCHEDULERS]}>
                  <div className="flex items-center gap-1">
                    {actions.map((action) => {
                      const meta = ACTION_META[action]
                      const Icon = meta.icon
                      return (
                        <Button
                          key={action}
                          size="sm"
                          variant={meta.variant ?? "default"}
                          className="text-xs"
                          disabled={act.isPending}
                          onClick={() => {
                            if (action === "cancel") {
                              setCancelTarget(appointment)
                              setCancelReason(CANCEL_REASONS[0])
                              setCancelNote("")
                            } else {
                              void runAction(appointment, action)
                            }
                          }}
                        >
                          <Icon className="size-3.5" />
                          {meta.label}
                        </Button>
                      )
                    })}
                    {(status === "booked" || status === "arrived") && (
                      <NewAppointmentDialog
                        rescheduleOf={{
                          id: appointment.id as string,
                          patientId:
                            appointmentPatient(appointment)?.reference?.split("/")[1] ?? "",
                          patientDisplay: patient?.display,
                        }}
                        trigger={
                          <Button size="sm" variant="ghost" className="text-xs">
                            Reschedule
                          </Button>
                        }
                      />
                    )}
                  </div>
                </RoleGate>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={cancelTarget !== null} onOpenChange={(v) => !v && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>
              The record is kept as cancelled with its reason — it is never deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label>Reason</Label>
              <Select value={cancelReason} onValueChange={(v) => setCancelReason(v ?? CANCEL_REASONS[0])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cancelReason === "Other" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cancel-note">Details</Label>
                <Input
                  id="cancel-note"
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  maxLength={200}
                  placeholder="Why is this being cancelled?"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              disabled={act.isPending || (cancelReason === "Other" && !cancelNote.trim())}
              onClick={async () => {
                if (!cancelTarget) return
                const reason =
                  cancelReason === "Other" ? cancelNote.trim() : cancelReason
                await runAction(cancelTarget, "cancel", reason)
                setCancelTarget(null)
              }}
            >
              {act.isPending && <Loader2Icon className="animate-spin" />}
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AppointmentsView }
