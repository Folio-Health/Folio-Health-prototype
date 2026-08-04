"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClipboardListIcon,
  MailIcon,
  PhoneIcon,
  StethoscopeIcon,
  UserRoundIcon,
  XCircleIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { RescheduleDialog } from "./reschedule-dialog"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import type { AppointmentStatus } from "@/types/core"

const TIMELINE_STEPS: AppointmentStatus[] = [
  "Scheduled",
  "Checked In",
  "In Progress",
  "Completed",
]

function InfoRow({ icon: Icon, label, value }: { icon: typeof PhoneIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    </div>
  )
}

function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const initial = useMemo(() => APPOINTMENTS.find((a) => a.id === appointmentId), [appointmentId])
  const [status, setStatus] = useState<AppointmentStatus | undefined>(initial?.status)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!initial) {
    return (
      <EmptyState
        title="Appointment not found"
        description="This appointment doesn't exist or may have been removed."
        action={
          <Button render={<Link href="/appointments" />} size="sm">
            Back to Appointments
          </Button>
        }
      />
    )
  }

  const appointment = { ...initial, status: status ?? initial.status }
  const patient = getPatientById(appointment.patientId)
  const doctor = getStaffById(appointment.doctorId)
  const isCancelled = appointment.status === "Cancelled" || appointment.status === "No Show"
  const currentStepIndex = TIMELINE_STEPS.indexOf(appointment.status)

  function handleCheckIn() {
    setStatus("Checked In")
    toast.success("Patient checked in")
  }

  function handleCancel() {
    setStatus("Cancelled")
    toast.success("Appointment cancelled")
  }

  return (
    <div>
      <PageHeader
        title={`Appointment ${appointment.id}`}
        description={format(new Date(appointment.startTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
        breadcrumbs={[
          { label: "Front Desk" },
          { label: "Appointments", href: "/appointments" },
          { label: appointment.id },
        ]}
        actions={
          <>
            {appointment.status === "Scheduled" && (
              <Button variant="outline" onClick={handleCheckIn}>
                <CheckCircle2Icon />
                Check In
              </Button>
            )}
            {(appointment.status === "Checked In" || appointment.status === "In Progress") && (
              <Button render={<Link href={`/consultation/${appointment.id}`} />}>
                <StethoscopeIcon />
                Start Consultation
              </Button>
            )}
            {!isCancelled && appointment.status !== "Completed" && (
              <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
                <CalendarClockIcon />
                Reschedule
              </Button>
            )}
            {!isCancelled && appointment.status !== "Completed" && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                <XCircleIcon />
                Cancel
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Patient</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {patient ? (
              <>
                <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                  <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="lg" />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground hover:text-primary hover:underline">
                      {patient.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {patient.mrn} &middot; {patient.gender}, {patient.age}y
                    </span>
                  </div>
                </Link>
                <div className="mt-1 flex flex-col gap-2.5">
                  <InfoRow icon={PhoneIcon} label="Phone" value={patient.phone} />
                  <InfoRow icon={MailIcon} label="Email" value={patient.email} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Patient record unavailable.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Doctor</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {doctor ? (
              <>
                <div className="flex items-center gap-3">
                  <PersonAvatar name={doctor.name} seed={doctor.avatarSeed} size="lg" />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{doctor.name}</span>
                    <span className="text-xs text-muted-foreground">{doctor.title}</span>
                  </div>
                </div>
                <div className="mt-1 flex flex-col gap-2.5">
                  <InfoRow icon={UserRoundIcon} label="Department" value={doctor.department} />
                  <InfoRow icon={PhoneIcon} label="Phone" value={doctor.phone} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Doctor record unavailable.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Visit Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <InfoRow icon={ClipboardListIcon} label="Type" value={appointment.type} />
            <InfoRow icon={ClipboardListIcon} label="Department" value={appointment.department} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <StatusBadge status={appointment.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reason & Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Reason for Visit</p>
              <p className="text-sm text-foreground">{appointment.reason}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Notes</p>
              <p className="text-sm text-muted-foreground">
                {appointment.notes ?? "No additional notes recorded for this appointment."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {isCancelled ? (
              <div className="flex items-center gap-2.5 text-sm text-destructive">
                <XCircleIcon className="size-4" />
                {appointment.status}
              </div>
            ) : (
              <ol className="flex flex-col gap-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = currentStepIndex >= 0 && i <= currentStepIndex
                  return (
                    <li key={step} className="flex items-center gap-2.5">
                      {done ? (
                        <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                      ) : (
                        <CircleIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={done ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                        {step}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <RescheduleDialog
        appointment={appointment}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this appointment?"
        description="The patient and doctor will be notified that this appointment has been cancelled."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        onConfirm={handleCancel}
      />
    </div>
  )
}

export { AppointmentDetail }
