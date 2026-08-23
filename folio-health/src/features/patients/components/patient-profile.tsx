"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { phoneInputProps, sanitizePhoneInput } from "@/lib/phone"
import { format } from "date-fns"
import {
  PencilIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UserRoundIcon,
  CalendarIcon,
  FlaskConicalIcon,
  ScanIcon,
  PillIcon,
  ReceiptIcon,
  Loader2Icon,
  SirenIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { BreakGlassDialog } from "./break-glass-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState, ErrorState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { usePatient } from "../hooks/use-patients"
import {
  usePatientAllergies,
  usePatientAppointments,
  usePatientConditions,
  useUpdatePatient,
} from "../hooks/use-patient-clinical"
import type { PatientSummary } from "@/lib/fhir/patient"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useUiStore } from "@/stores/ui-store"
import {
  getVisiblePatientTabs,
  canEditDemographics,
  getVisibleIdentityFields,
  type PatientTabKey,
} from "../lib/patient-tabs-access"

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PhoneIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground">{value || "—"}</span>
      </div>
    </div>
  )
}

/** A cross-module tab that intentionally links out rather than duplicating a module. */
function ModuleLinkTab({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof FlaskConicalIcon
  title: string
  description: string
  href: string
}) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        <Button size="sm" variant="outline" render={<Link href={href} />}>
          Open module
        </Button>
      }
    />
  )
}

function PatientProfile({ patientId }: { patientId: string }) {
  const { data: patient, isLoading, isError, error, refetch } = usePatient(patientId)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Patient" breadcrumbs={[{ label: "Patients", href: "/patients" }]} />
        <ListSkeleton />
      </div>
    )
  }

  if (isError) {
    const notFound = (error as { status?: number })?.status === 404
    return (
      <div>
        <PageHeader title="Patient" breadcrumbs={[{ label: "Patients", href: "/patients" }]} />
        {notFound ? (
          <EmptyState
            title="Patient not found"
            description="This patient record doesn't exist, or you don't have access to it."
            action={
              <Button render={<Link href="/patients" />} size="sm">
                Back to Patients
              </Button>
            }
          />
        ) : (
          <ErrorState
            title="Could not load this patient"
            description={error instanceof Error ? error.message : "Could not reach Folio. Check your connection and try again."}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        )}
      </div>
    )
  }

  if (!patient) return null
  return <PatientProfileContent patient={patient} />
}

function PatientProfileContent({ patient }: { patient: PatientSummary }) {
  const [editOpen, setEditOpen] = useState(false)
  const [breakGlassOpen, setBreakGlassOpen] = useState(false)
  const [editName, setEditName] = useState(patient.name)
  const [editPhone, setEditPhone] = useState(patient.phone)
  const [editEmail, setEditEmail] = useState(patient.email)

  const { data: currentUser } = useCurrentUser()
  const previewRole = useUiStore((s) => s.previewRole)
  // Respects "preview as role" the same way nav/dashboard/RoleGate do, so
  // this page matches what's shown everywhere else while previewing.
  const roles = previewRole ? [previewRole] : (currentUser?.roles ?? [])
  const visibleTabs = getVisiblePatientTabs(roles)
  const isTabVisible = (tab: PatientTabKey) => visibleTabs.includes(tab)
  const canEdit = canEditDemographics(roles)
  const visibleFields = getVisibleIdentityFields(roles)

  // Controlled, not just a defaultValue: when previewing a different role
  // changes which tabs exist, an uncontrolled Tabs keeps its old selection
  // (Base UI warns about this, and the selected tab can point at content
  // that's no longer there). Reset to the first still-visible tab instead.
  const [activeTab, setActiveTab] = useState<PatientTabKey>(visibleTabs[0] ?? "overview")
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) setActiveTab(visibleTabs[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs])

  const allergies = usePatientAllergies(patient.id)
  const conditions = usePatientConditions(patient.id)
  const appointments = usePatientAppointments(patient.id)
  const updatePatient = useUpdatePatient(patient.id)

  // Re-seed the form whenever the underlying record changes (e.g. after a save
  // refetch), so the dialog never reopens holding stale values.
  useEffect(() => {
    setEditName(patient.name)
    setEditPhone(patient.phone)
    setEditEmail(patient.email)
  }, [patient.name, patient.phone, patient.email])

  async function handleSaveEdit() {
    try {
      await updatePatient.mutateAsync({ name: editName, phone: editPhone, email: editEmail })
      toast.success("Patient details saved")
      setEditOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save patient details")
    }
  }

  return (
    <div>
      <PageHeader
        title={patient.name}
        description={/^mrn/i.test(patient.mrn) ? patient.mrn : `MRN ${patient.mrn}`}
        breadcrumbs={[{ label: "Patients", href: "/patients" }, { label: patient.name }]}
        actions={
          <div className="flex items-center gap-2">
            <RoleGate roles={["doctor", "nurse"]}>
              <Button variant="outline" onClick={() => setBreakGlassOpen(true)}>
                <SirenIcon />
                Emergency Access
              </Button>
            </RoleGate>
            {canEdit && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <PencilIcon />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <BreakGlassDialog
        patientName={patient.name}
        open={breakGlassOpen}
        onOpenChange={setBreakGlassOpen}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="flex flex-col gap-5 pt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <PersonAvatar name={patient.name} seed={patient.id} size="lg" />
              <div className="flex flex-col gap-1">
                <p className="font-heading text-lg font-semibold text-foreground">{patient.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{patient.mrn}</p>
              </div>
              <StatusBadge status={patient.status} />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              {visibleFields.has("ageGender") && (
                <InfoRow
                  icon={UserRoundIcon}
                  label="Age / Gender"
                  value={`${patient.age ?? "Unknown"}${patient.age !== undefined ? " yrs" : ""} · ${patient.gender}`}
                />
              )}
              {visibleFields.has("dob") && (
                <InfoRow icon={CalendarIcon} label="Date of birth" value={patient.dob ?? ""} />
              )}
              {visibleFields.has("phone") && <InfoRow icon={PhoneIcon} label="Phone" value={patient.phone} />}
              {visibleFields.has("email") && <InfoRow icon={MailIcon} label="Email" value={patient.email} />}
              {visibleFields.has("address") && (
                <InfoRow icon={MapPinIcon} label="Address" value={patient.address} />
              )}
              {visibleFields.size === 0 && (
                <p className="text-xs text-muted-foreground">
                  No additional identity details for your role.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {visibleTabs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                title="No additional sections for your role"
                description="Your role doesn't include chart access beyond this patient's identity details."
              />
            </CardContent>
          </Card>
        ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PatientTabKey)}>
          <TabsList>
            {isTabVisible("overview") && <TabsTrigger value="overview">Overview</TabsTrigger>}
            {isTabVisible("history") && <TabsTrigger value="history">Medical History</TabsTrigger>}
            {isTabVisible("appointments") && <TabsTrigger value="appointments">Appointments</TabsTrigger>}
            {isTabVisible("lab") && <TabsTrigger value="lab">Lab</TabsTrigger>}
            {isTabVisible("imaging") && <TabsTrigger value="imaging">Imaging</TabsTrigger>}
            {isTabVisible("pharmacy") && <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>}
            {isTabVisible("billing") && <TabsTrigger value="billing">Billing</TabsTrigger>}
          </TabsList>

          {isTabVisible("overview") && <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                {allergies.isLoading ? (
                  <ListSkeleton />
                ) : allergies.data?.length ? (
                  <ul className="flex flex-col gap-2">
                    {allergies.data.map((allergy) => (
                      <li
                        key={allergy.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {allergy.code?.text ?? allergy.code?.coding?.[0]?.display ?? "Unspecified"}
                        </span>
                        {allergy.criticality && (
                          <StatusBadge status={allergy.criticality === "high" ? "Critical" : "Active"} />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No recorded allergies"
                    description="No AllergyIntolerance records exist for this patient."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>}

          {isTabVisible("history") && <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {conditions.isLoading ? (
                  <ListSkeleton />
                ) : conditions.data?.length ? (
                  <ul className="flex flex-col gap-2">
                    {conditions.data.map((condition) => (
                      <li
                        key={condition.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">
                          {condition.code?.text ?? condition.code?.coding?.[0]?.display ?? "Unspecified"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {condition.recordedDate
                            ? format(new Date(condition.recordedDate), "d MMM yyyy")
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No recorded conditions"
                    description="No Condition records exist for this patient yet."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>}

          {isTabVisible("appointments") && <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.isLoading ? (
                  <ListSkeleton />
                ) : appointments.data?.length ? (
                  <ul className="flex flex-col gap-2">
                    {appointments.data.map((appointment) => (
                      <li
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {appointment.description ??
                              appointment.serviceType?.[0]?.coding?.[0]?.display ??
                              "Appointment"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.start
                              ? format(new Date(appointment.start), "d MMM yyyy, HH:mm")
                              : "No date"}
                          </span>
                        </div>
                        {appointment.status && <StatusBadge status={appointment.status} />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No appointments"
                    description="This patient has no Appointment records."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>}

          {isTabVisible("lab") && <TabsContent value="lab">
            <ModuleLinkTab
              icon={FlaskConicalIcon}
              title="Lab results"
              description="Diagnostic reports are managed in the Laboratory module."
              href="/laboratory"
            />
          </TabsContent>}
          {isTabVisible("imaging") && <TabsContent value="imaging">
            <ModuleLinkTab
              icon={ScanIcon}
              title="Imaging studies"
              description="Imaging studies are managed in the Radiology module."
              href="/radiology"
            />
          </TabsContent>}
          {isTabVisible("pharmacy") && <TabsContent value="pharmacy">
            <ModuleLinkTab
              icon={PillIcon}
              title="Prescriptions"
              description="Medication requests are managed in the Pharmacy module."
              href="/pharmacy"
            />
          </TabsContent>}
          {isTabVisible("billing") && <TabsContent value="billing">
            <ModuleLinkTab
              icon={ReceiptIcon}
              title="Invoices"
              description="Invoices and claims are managed in the Billing module."
              href="/billing"
            />
          </TabsContent>}
        </Tabs>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit patient</DialogTitle>
            <DialogDescription>
              Changes are saved to the patient&apos;s record.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">Full name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" {...phoneInputProps} value={editPhone} onChange={(e) => setEditPhone(sanitizePhoneInput(e.target.value))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={updatePatient.isPending}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={updatePatient.isPending}>
              {updatePatient.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PatientProfile }
