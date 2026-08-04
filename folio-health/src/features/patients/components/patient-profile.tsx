"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  PencilIcon,
  PrinterIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  DropletIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { TrendChart } from "@/components/charts/trend-chart"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { getVitalsForPatient, getLatestVitalsForPatient } from "@/lib/mock/vitals"
import { getAppointmentsForPatient } from "@/lib/mock/appointments"
import { format } from "date-fns"
import type { Patient, BloodGroup } from "@/types/core"

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
import {
  FileTextIcon,
  FlaskConicalIcon,
  ScanIcon,
  PillIcon,
  ReceiptIcon,
} from "lucide-react"

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

function PatientProfile({ patientId }: { patientId: string }) {
  const foundPatient = getPatientById(patientId)

  if (!foundPatient) {
    return (
      <EmptyState
        title="Patient not found"
        description="This patient record doesn't exist or may have been archived."
        action={
          <Button render={<Link href="/patients" />} size="sm">
            Back to Patients
          </Button>
        }
      />
    )
  }

  return <PatientProfileContent initialPatient={foundPatient} />
}

function PatientProfileContent({ initialPatient }: { initialPatient: Patient }) {
  const [patient, setPatient] = useState(initialPatient)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(patient.name)
  const [editPhone, setEditPhone] = useState(patient.phone)
  const [editEmail, setEditEmail] = useState(patient.email)
  const [editBloodGroup, setEditBloodGroup] = useState(patient.bloodGroup)

  const doctor = getStaffById(patient.primaryDoctorId)
  const vitals = getVitalsForPatient(patient.id)
  const latestVitals = getLatestVitalsForPatient(patient.id)
  const visits = getAppointmentsForPatient(patient.id)
  const vitalsTrend = vitals.map((v) => ({
    date: format(new Date(v.recordedAt), "MMM d"),
    systolic: v.bpSystolic,
    diastolic: v.bpDiastolic,
  }))

  function openEdit() {
    setEditName(patient.name)
    setEditPhone(patient.phone)
    setEditEmail(patient.email)
    setEditBloodGroup(patient.bloodGroup)
    setEditOpen(true)
  }

  function handleSaveEdit() {
    const [firstName, ...rest] = editName.trim().split(" ")
    setPatient((prev) => ({
      ...prev,
      name: editName.trim() || prev.name,
      firstName: firstName || prev.firstName,
      lastName: rest.join(" ") || prev.lastName,
      phone: editPhone.trim() || prev.phone,
      email: editEmail.trim() || prev.email,
      bloodGroup: editBloodGroup,
    }))
    toast.success("Patient details updated")
    setEditOpen(false)
  }

  return (
    <div>
      <PageHeader
        title={patient.name}
        breadcrumbs={[
          { label: "Front Desk" },
          { label: "Patients", href: "/patients" },
          { label: `${patient.name} (${patient.mrn})` },
        ]}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => window.print()} aria-label="Print patient summary">
              <PrinterIcon />
            </Button>
            <Button onClick={openEdit}>
              <PencilIcon />
              Edit
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="lg" className="size-20" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">{patient.name}</p>
              <p className="text-sm text-muted-foreground">
                {patient.gender}, {patient.age} Years &middot; {patient.mrn}
              </p>
            </div>
            <StatusBadge status={patient.status} />
            <div className="mt-2 flex w-full flex-col gap-3 text-left">
              <InfoRow icon={PhoneIcon} label="Phone" value={patient.phone} />
              <InfoRow icon={MailIcon} label="Email" value={patient.email} />
              <InfoRow icon={UserRoundIcon} label="Primary Doctor" value={doctor?.name ?? "Unassigned"} />
              <InfoRow icon={MapPinIcon} label="Address" value={`${patient.address.city}, ${patient.address.state}`} />
              <InfoRow icon={DropletIcon} label="Blood Group" value={patient.bloodGroup} />
              <InfoRow icon={ShieldCheckIcon} label="Insurance" value={patient.insurance.provider} />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs defaultValue="overview">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              {[
                "Overview",
                "Medical History",
                "Vitals",
                "Lab Results",
                "Radiology",
                "Prescriptions",
                "Billing",
                "Insurance",
                "Allergies",
                "Files",
              ].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase().replace(" ", "-")}
                  className="rounded-md border border-transparent bg-muted/60 px-3 py-1.5 data-active:border-border data-active:bg-background"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Vitals (Latest)</CardTitle>
                    <CardDescription>
                      {latestVitals
                        ? format(new Date(latestVitals.recordedAt), "MMM d, yyyy")
                        : "No readings recorded"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    {latestVitals ? (
                      <>
                        <Metric label="Blood Pressure" value={`${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`} unit="mmHg" />
                        <Metric label="Heart Rate" value={String(latestVitals.pulse)} unit="bpm" />
                        <Metric label="Temperature" value={String(latestVitals.temperature)} unit="°C" />
                        <Metric label="SpO2" value={String(latestVitals.spo2)} unit="%" />
                        <Metric label="Weight" value={String(latestVitals.weight)} unit="kg" />
                        <Metric label="BMI" value={String(latestVitals.bmi)} unit="" />
                      </>
                    ) : (
                      <p className="col-span-2 text-sm text-muted-foreground">No vitals recorded yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Current Diagnosis</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {patient.chronicConditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active diagnoses on record.</p>
                    ) : (
                      patient.chronicConditions.map((condition) => (
                        <div key={condition} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{condition}</span>
                          <StatusBadge status="Active" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Allergies</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {patient.allergies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No known allergies.</p>
                    ) : (
                      patient.allergies.map((allergy) => (
                        <div key={allergy} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{allergy}</span>
                          <StatusBadge status="Active" tone="red" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Visits</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2.5">
                    {visits.slice(0, 4).map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{visit.reason}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(visit.startTime), "MMM d")}
                        </span>
                      </div>
                    ))}
                    {visits.length === 0 && (
                      <p className="text-sm text-muted-foreground">No visit history yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="medical-history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Chronic conditions, past procedures, and family history</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Chronic Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.chronicConditions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">None recorded.</p>
                      ) : (
                        patient.chronicConditions.map((c) => <StatusBadge key={c} status={c} tone="blue" />)
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Occupation & Lifestyle</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.occupation} &middot; {patient.maritalStatus}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vitals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blood Pressure Trend</CardTitle>
                  <CardDescription>Last {vitals.length} readings</CardDescription>
                </CardHeader>
                <CardContent>
                  {vitalsTrend.length > 1 ? (
                    <TrendChart
                      data={vitalsTrend}
                      xKey="date"
                      type="line"
                      series={[
                        { key: "systolic", label: "Systolic", color: "var(--chart-1)" },
                        { key: "diastolic", label: "Diastolic", color: "var(--chart-2)" },
                      ]}
                    />
                  ) : (
                    <EmptyState title="Not enough data" description="At least two readings are needed to chart a trend." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lab-results" className="mt-4">
              <EmptyState
                icon={FlaskConicalIcon}
                title="No lab orders linked yet"
                description="Lab orders placed for this patient will appear here."
                action={
                  <Button size="sm" render={<Link href="/laboratory" />}>
                    Go to Laboratory
                  </Button>
                }
              />
            </TabsContent>

            <TabsContent value="radiology" className="mt-4">
              <EmptyState
                icon={ScanIcon}
                title="No imaging studies linked yet"
                description="Radiology requests and reports for this patient will appear here."
                action={
                  <Button size="sm" render={<Link href="/radiology" />}>
                    Go to Radiology
                  </Button>
                }
              />
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-4">
              <EmptyState
                icon={PillIcon}
                title="No active prescriptions"
                description="Prescriptions written for this patient will appear here."
                action={
                  <Button size="sm" render={<Link href="/pharmacy" />}>
                    Go to Pharmacy
                  </Button>
                }
              />
            </TabsContent>

            <TabsContent value="billing" className="mt-4">
              <EmptyState
                icon={ReceiptIcon}
                title="No invoices yet"
                description="Invoices and payments for this patient will appear here."
                action={
                  <Button size="sm" render={<Link href="/billing" />}>
                    Go to Billing
                  </Button>
                }
              />
            </TabsContent>

            <TabsContent value="insurance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Metric label="Provider" value={patient.insurance.provider} unit="" />
                  <Metric label="Plan" value={patient.insurance.plan} unit="" />
                  <Metric label="Policy Number" value={patient.insurance.policyNumber} unit="" />
                  <Metric label="Valid Till" value={format(new Date(patient.insurance.validTill), "MMM d, yyyy")} unit="" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allergies" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Allergies</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {patient.allergies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No known allergies on record.</p>
                  ) : (
                    patient.allergies.map((allergy) => (
                      <div key={allergy} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <span className="text-sm text-foreground">{allergy}</span>
                        <StatusBadge status="Confirmed" tone="red" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <EmptyState
                icon={FileTextIcon}
                title="No documents uploaded"
                description="Consent forms, referral letters, and scanned documents will appear here."
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Update {patient.name}&apos;s contact and demographic details.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-patient-name">Full name</Label>
              <Input id="edit-patient-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-patient-phone">Phone</Label>
                <Input id="edit-patient-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-patient-blood">Blood group</Label>
                <Select value={editBloodGroup} onValueChange={(v) => setEditBloodGroup((v as BloodGroup) ?? editBloodGroup)}>
                  <SelectTrigger id="edit-patient-blood" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-patient-email">Email</Label>
              <Input id="edit-patient-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">
        {value} <span className="font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}

export { PatientProfile }
